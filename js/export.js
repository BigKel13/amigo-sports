/* ═══════════════════════════════════════
   Export — CSV & JSON
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

function exportCSV() {
  const schools = window.AmigoMap.schools || [];
  const rows = [['Name', 'City', 'State', 'Conference', 'Region', 'Subdivision', 'Type',
    'Varsity Sports', 'Endowment ($B)', 'NIL Est. ($M)',
    'Pipeline Status', 'POC Names', 'POC Emails', 'Notes', 'Visit Notes', 'Last Updated']];

  schools.forEach(school => {
    const crm = window.AmigoMap.crm.getCrmState(school.id);
    rows.push([
      school.name, school.city, school.state, school.conference, school.region,
      school.subdivision, school.type, school.varsitySports,
      school.endowmentB || '', school.nilEstimateM || '',
      window.AmigoMap.crm.getStatusLabel(crm.status),
      (crm.poc || []).map(p => p.name).join('; '),
      (crm.poc || []).map(p => p.email).filter(Boolean).join('; '),
      (crm.notes || '').replace(/[\n\r]/g, ' '),
      (crm.visitNotes || '').replace(/[\n\r]/g, ' '),
      crm.lastUpdated || ''
    ]);
  });

  const csv = rows.map(row => row.map(cell =>
    typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))
      ? '"' + cell.replace(/"/g, '""') + '"' : cell
  ).join(',')).join('\n');

  download(csv, 'amigo-crm-export.csv', 'text/csv');
}

function exportJSON() {
  const schools = window.AmigoMap.schools || [];
  const data = schools.map(school => ({
    ...school,
    crm: window.AmigoMap.crm.getCrmState(school.id)
  }));
  download(JSON.stringify(data, null, 2), 'amigo-crm-export.json', 'application/json');
}

function download(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function initExport() {
  document.getElementById('btn-export').addEventListener('click', () => {
    document.getElementById('export-modal').classList.remove('hidden');
  });
  document.getElementById('close-export').addEventListener('click', () => {
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('export-csv').addEventListener('click', () => {
    exportCSV();
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('export-json').addEventListener('click', () => {
    exportJSON();
    document.getElementById('export-modal').classList.add('hidden');
  });
  document.getElementById('export-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) document.getElementById('export-modal').classList.add('hidden');
  });
}

window.AmigoMap.export = { initExport };
