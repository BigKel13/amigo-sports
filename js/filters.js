/* ═══════════════════════════════════════
   Filter System
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

let activeRegions = new Set(['North', 'South', 'East', 'West']);
let activeConferences = new Set(); // empty = all
let activeStatuses = new Set(['not_started', 'outreach_begun', 'in_contact', 'visited', 'proposal_out', 'on_board']);
let activeTypes = new Set(['public', 'private']);
let activeSubdivs = new Set(['FBS', 'FCS', 'D1']);

const POWER_CONFERENCES = ['ACC', 'Big Ten', 'Big 12', 'SEC', 'Big East'];

function getAllConferences() {
  const confs = new Set();
  (window.AmigoMap.schools || []).forEach(s => confs.add(s.conference));
  return [...confs].sort();
}

function getFilteredSchools() {
  return (window.AmigoMap.schools || []).filter(school => {
    const crm = window.AmigoMap.crm.getCrmState(school.id);
    if (activeRegions.size > 0 && !activeRegions.has(school.region)) return false;
    if (activeConferences.size > 0 && !activeConferences.has(school.conference)) return false;
    if (!activeStatuses.has(crm.status)) return false;
    if (!activeTypes.has(school.type)) return false;
    if (!activeSubdivs.has(school.subdivision)) return false;
    return true;
  });
}

function initFilters() {
  // Region chips
  document.querySelectorAll('#region-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const region = chip.dataset.region;
      if (region === 'all') {
        const allActive = activeRegions.size === 4;
        activeRegions = allActive ? new Set() : new Set(['North', 'South', 'East', 'West']);
      } else {
        activeRegions.has(region) ? activeRegions.delete(region) : activeRegions.add(region);
      }
      updateChipStates('#region-filters', activeRegions, ['North', 'South', 'East', 'West']);
      applyFilters();
    });
  });

  // Status chips
  document.querySelectorAll('#status-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const status = chip.dataset.status;
      const allKeys = window.AmigoMap.crm.PIPELINE.map(p => p.key);
      if (status === 'all') {
        const allActive = activeStatuses.size === allKeys.length;
        activeStatuses = allActive ? new Set() : new Set(allKeys);
      } else {
        activeStatuses.has(status) ? activeStatuses.delete(status) : activeStatuses.add(status);
      }
      updateChipStates('#status-filters', activeStatuses, allKeys);
      applyFilters();
    });
  });

  // Type chips
  document.querySelectorAll('#type-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const type = chip.dataset.type;
      if (type === 'all') {
        const allActive = activeTypes.size === 2;
        activeTypes = allActive ? new Set() : new Set(['public', 'private']);
      } else {
        activeTypes.has(type) ? activeTypes.delete(type) : activeTypes.add(type);
      }
      updateChipStates('#type-filters', activeTypes, ['public', 'private']);
      applyFilters();
    });
  });

  // Subdivision chips
  document.querySelectorAll('#subdiv-filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const subdiv = chip.dataset.subdiv;
      if (subdiv === 'all') {
        const allActive = activeSubdivs.size === 3;
        activeSubdivs = allActive ? new Set() : new Set(['FBS', 'FCS', 'D1']);
      } else {
        activeSubdivs.has(subdiv) ? activeSubdivs.delete(subdiv) : activeSubdivs.add(subdiv);
      }
      updateChipStates('#subdiv-filters', activeSubdivs, ['FBS', 'FCS', 'D1']);
      applyFilters();
    });
  });

  // Conference filter
  initConferenceFilter();
}

function initConferenceFilter() {
  const search = document.getElementById('conf-search');
  const dropdown = document.getElementById('conf-dropdown');
  const confs = getAllConferences();

  function buildDropdown(filter = '') {
    const power = confs.filter(c => POWER_CONFERENCES.includes(c));
    const mid = confs.filter(c => !POWER_CONFERENCES.includes(c));
    const filterLower = filter.toLowerCase();

    let html = '<div class="conf-group-label">Power Conferences</div>';
    power.filter(c => c.toLowerCase().includes(filterLower)).forEach(c => {
      const checked = activeConferences.size === 0 || activeConferences.has(c) ? 'checked' : '';
      html += `<label><input type="checkbox" value="${c}" ${checked}>${c}</label>`;
    });
    html += '<div class="conf-group-label">Mid-Major & Other</div>';
    mid.filter(c => c.toLowerCase().includes(filterLower)).forEach(c => {
      const checked = activeConferences.size === 0 || activeConferences.has(c) ? 'checked' : '';
      html += `<label><input type="checkbox" value="${c}" ${checked}>${c}</label>`;
    });
    dropdown.innerHTML = html;

    dropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (activeConferences.size === 0) {
            // First specific selection — switch from "all" to specific
            confs.forEach(c => activeConferences.add(c));
          }
          activeConferences.add(cb.value);
        } else {
          if (activeConferences.size === 0) {
            confs.forEach(c => activeConferences.add(c));
          }
          activeConferences.delete(cb.value);
          if (activeConferences.size === confs.length) activeConferences.clear(); // back to all
        }
        applyFilters();
      });
    });
  }

  search.addEventListener('focus', () => {
    buildDropdown(search.value);
    dropdown.classList.add('open');
  });
  search.addEventListener('input', () => buildDropdown(search.value));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-select-wrap')) dropdown.classList.remove('open');
  });
}

function updateChipStates(containerSelector, activeSet, allKeys) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  const allChip = container.querySelector('[data-region="all"], [data-status="all"], [data-type="all"], [data-subdiv="all"]');
  if (allChip) allChip.classList.toggle('active', activeSet.size === allKeys.length);
  container.querySelectorAll('.chip:not([data-region="all"]):not([data-status="all"]):not([data-type="all"]):not([data-subdiv="all"])').forEach(chip => {
    const val = chip.dataset.region || chip.dataset.status || chip.dataset.type || chip.dataset.subdiv;
    chip.classList.toggle('active', activeSet.has(val));
  });
}

function applyFilters() {
  const filtered = getFilteredSchools();
  window.AmigoMap.markers.renderMarkers(filtered);
  window.AmigoMap.sidebar.renderList(filtered);
  updateStats(filtered);
  updateFilterCount(filtered);
}

function updateStats(filtered) {
  const counts = window.AmigoMap.crm.getPipelineCounts(filtered);
  document.getElementById('stat-not-started').textContent = counts.not_started || 0;
  document.getElementById('stat-outreach').textContent = counts.outreach_begun || 0;
  document.getElementById('stat-contact').textContent = counts.in_contact || 0;
  document.getElementById('stat-visited').textContent = counts.visited || 0;
  document.getElementById('stat-proposal').textContent = counts.proposal_out || 0;
  document.getElementById('stat-onboard').textContent = counts.on_board || 0;
}

function updateFilterCount(filtered) {
  const total = (window.AmigoMap.schools || []).length;
  document.getElementById('filter-count').innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${total}</strong> schools`;
}

window.AmigoMap.filters = { initFilters, applyFilters, getFilteredSchools };
