/* ═══════════════════════════════════════
   CRM State Management — localStorage
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

const PIPELINE = [
  { key: 'not_started',    label: 'Not Started', short: 'New',      color: '#6b6b73' },
  { key: 'outreach_begun', label: 'Outreach',    short: 'Outreach', color: '#E8C44A' },
  { key: 'in_contact',     label: 'In Contact',  short: 'Contact',  color: '#4A9EE8' },
  { key: 'visited',        label: 'Visited',     short: 'Visited',  color: '#9B59B6' },
  { key: 'proposal_out',   label: 'Proposal',    short: 'Proposal', color: '#E8634A' },
  { key: 'on_board',       label: 'On Board',    short: 'Won',      color: '#1D9E75' },
];

const PIPELINE_MAP = {};
PIPELINE.forEach((s, i) => { PIPELINE_MAP[s.key] = { ...s, index: i }; });

function getCrmState(schoolId) {
  try {
    const stored = localStorage.getItem('amigo-crm-' + schoolId);
    if (stored) return JSON.parse(stored);
  } catch (e) { /* ignore parse errors */ }
  return { status: 'not_started', poc: [], notes: '', visitNotes: '', lastUpdated: null, visitDates: [] };
}

function setCrmState(schoolId, updates) {
  const current = getCrmState(schoolId);
  const merged = { ...current, ...updates, lastUpdated: new Date().toISOString() };
  localStorage.setItem('amigo-crm-' + schoolId, JSON.stringify(merged));
  return merged;
}

function setStatus(schoolId, status) {
  return setCrmState(schoolId, { status });
}

function addPoc(schoolId, poc) {
  const current = getCrmState(schoolId);
  current.poc.push({ ...poc, id: Date.now().toString(36) });
  return setCrmState(schoolId, { poc: current.poc });
}

function removePoc(schoolId, pocId) {
  const current = getCrmState(schoolId);
  current.poc = current.poc.filter(p => p.id !== pocId);
  return setCrmState(schoolId, { poc: current.poc });
}

function updatePoc(schoolId, pocId, updates) {
  const current = getCrmState(schoolId);
  current.poc = current.poc.map(p => p.id === pocId ? { ...p, ...updates } : p);
  return setCrmState(schoolId, { poc: current.poc });
}

function setNotes(schoolId, notes) {
  return setCrmState(schoolId, { notes });
}

function setVisitNotes(schoolId, visitNotes) {
  return setCrmState(schoolId, { visitNotes });
}

function getStatusColor(status) {
  return PIPELINE_MAP[status]?.color || '#6b6b73';
}

function getStatusLabel(status) {
  return PIPELINE_MAP[status]?.label || 'Not Started';
}

function getStatusIndex(status) {
  return PIPELINE_MAP[status]?.index ?? 0;
}

function getAllCrmData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('amigo-crm-')) {
      const id = key.replace('amigo-crm-', '');
      try { data[id] = JSON.parse(localStorage.getItem(key)); } catch (e) {}
    }
  }
  return data;
}

function getPipelineCounts(schools) {
  const counts = {};
  PIPELINE.forEach(s => { counts[s.key] = 0; });
  (schools || window.AmigoMap.schools || []).forEach(s => {
    const crm = getCrmState(s.id);
    counts[crm.status] = (counts[crm.status] || 0) + 1;
  });
  return counts;
}

// Expose
window.AmigoMap.crm = {
  PIPELINE, PIPELINE_MAP, getCrmState, setCrmState, setStatus,
  addPoc, removePoc, updatePoc, setNotes, setVisitNotes,
  getStatusColor, getStatusLabel, getStatusIndex,
  getAllCrmData, getPipelineCounts
};
