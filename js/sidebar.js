/* ═══════════════════════════════════════
   Sidebar — List, Detail, POC, Notes
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

let currentSort = 'name';
let currentSchool = null;
let debounceTimer = null;

function formatLastContacted(iso) {
  if (!iso) return 'Never';
  const then = new Date(iso);
  if (isNaN(then.getTime())) return 'Never';
  const now = new Date();
  const days = Math.floor((now - then) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return then.toLocaleDateString();
}

function renderList(schools) {
  const listEl = document.getElementById('school-list');
  const sorted = sortSchools(schools, currentSort);

  listEl.innerHTML = sorted.map(school => {
    const crm = window.AmigoMap.crm.getCrmState(school.id);
    const color = window.AmigoMap.crm.getStatusColor(crm.status);
    const logoUrl = window.AmigoMap.markers.getLogoUrl(school);
    const initials = window.AmigoMap.markers.getInitials(school.name);
    return `<div class="school-item" data-id="${school.id}">
      ${logoUrl
        ? `<img class="school-item-logo" src="${logoUrl}" alt="" onerror="this.outerHTML='<div class=\\'school-item-logo marker-fallback\\'>${initials}</div>'" />`
        : `<div class="school-item-logo marker-fallback">${initials}</div>`}
      <div class="school-item-info">
        <div class="school-item-name">${school.name}</div>
        <div class="school-item-meta">${school.conference} · ${school.city}, ${school.state}</div>
      </div>
      <div class="school-item-status" style="background:${color}" title="${window.AmigoMap.crm.getStatusLabel(crm.status)}"></div>
    </div>`;
  }).join('');

  listEl.querySelectorAll('.school-item').forEach(item => {
    item.addEventListener('click', () => {
      const school = window.AmigoMap.schools.find(s => s.id === item.dataset.id);
      if (school) showDetail(school);
    });
  });
}

function sortSchools(schools, sortBy) {
  return [...schools].sort((a, b) => {
    if (sortBy === 'status') {
      const ai = window.AmigoMap.crm.getStatusIndex(window.AmigoMap.crm.getCrmState(a.id).status);
      const bi = window.AmigoMap.crm.getStatusIndex(window.AmigoMap.crm.getCrmState(b.id).status);
      return bi - ai || a.name.localeCompare(b.name);
    }
    if (sortBy === 'conference') return a.conference.localeCompare(b.conference) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
}

function showDetail(school) {
  currentSchool = school;
  document.getElementById('list-view').classList.add('hidden');
  document.getElementById('visit-view').classList.add('hidden');
  document.getElementById('detail-view').classList.remove('hidden');

  window.AmigoMap.markers.flyToSchool(school.id, window.AmigoMap.map);
  renderDetailContent(school);
}

function renderDetailContent(school) {
  const crm = window.AmigoMap.crm.getCrmState(school.id);
  const logoUrl = window.AmigoMap.markers.getLogoUrl(school);
  const initials = window.AmigoMap.markers.getInitials(school.name);

  const fmtMoney = (val, unit) => {
    if (!val || val === 0) return 'N/A';
    if (unit === 'B') return val >= 1 ? `$${val.toFixed(1)}B` : `$${(val * 1000).toFixed(0)}M`;
    return `$${val.toFixed(1)}M`;
  };

  const pipelineHtml = window.AmigoMap.crm.PIPELINE.map((stage, i) => {
    const currentIdx = window.AmigoMap.crm.getStatusIndex(crm.status);
    const cls = i === currentIdx ? 'active' : i < currentIdx ? 'completed' : '';
    return `<div class="pipeline-step ${cls}" data-status="${stage.key}" style="color:${stage.color}">
      <div class="step-dot"></div>
      <div class="step-label">${stage.short}</div>
    </div>`;
  }).join('');

  const pocHtml = crm.poc.map(p => `
    <div class="poc-card" data-poc-id="${p.id}">
      <div class="poc-name">${p.name || 'Unnamed'}</div>
      <div class="poc-title">${p.title || ''}</div>
      ${p.email ? `<div class="poc-contact">${p.email}</div>` : ''}
      ${p.phone ? `<div class="poc-contact">${p.phone}</div>` : ''}
      <div class="poc-last-contacted">Last contacted: <strong>${formatLastContacted(p.lastContacted)}</strong></div>
      <div class="poc-actions">
        <button class="btn-tiny mark-contacted">Mark contacted today</button>
        <button class="btn-tiny edit-poc">Edit</button>
        <button class="btn-tiny danger remove-poc">Remove</button>
      </div>
    </div>
  `).join('');

  document.getElementById('detail-content').innerHTML = `
    <div class="detail-hero">
      ${logoUrl
        ? `<img class="detail-logo" src="${logoUrl}" alt="${school.name}" onerror="this.outerHTML='<div class=\\'detail-logo marker-fallback\\' style=\\'font-size:18px\\'>${initials}</div>'" />`
        : `<div class="detail-logo marker-fallback" style="font-size:18px">${initials}</div>`}
      <div class="detail-title">
        <h2>${school.name}</h2>
        <div class="detail-location">${school.city}, ${school.state}</div>
        <div class="detail-badges">
          <span class="badge badge-conf">${school.conference}</span>
          <span class="badge badge-subdiv">${school.subdivision}</span>
          <span class="badge badge-type">${school.type}</span>
        </div>
      </div>
    </div>

    <div class="pipeline-stepper">${pipelineHtml}</div>

    <div class="detail-stats">
      <div class="stat-card"><div class="stat-value">${school.varsitySports}</div><div class="stat-label">Varsity Sports</div></div>
      <div class="stat-card"><div class="stat-value">${fmtMoney(school.endowmentB, 'B')}</div><div class="stat-label">Endowment</div></div>
      <div class="stat-card"><div class="stat-value">${fmtMoney(school.nilEstimateM, 'M')}</div><div class="stat-label">NIL Est. (Annual)</div></div>
      <div class="stat-card"><div class="stat-value">${school.region}</div><div class="stat-label">Region</div></div>
    </div>

    <div class="detail-section">
      <h4>Points of Contact</h4>
      ${pocHtml}
      <button class="add-poc-btn" id="add-poc-btn">+ Add Contact</button>
      <div id="poc-form-area"></div>
    </div>

    <div class="detail-section">
      <h4>Notes</h4>
      <textarea class="notes-textarea" id="notes-field" placeholder="Add notes about this school...">${crm.notes || ''}</textarea>
    </div>

    <div class="detail-section">
      <h4>Visit Notes</h4>
      <textarea class="notes-textarea" id="visit-notes-field" placeholder="Notes from campus visits...">${crm.visitNotes || ''}</textarea>
    </div>
  `;

  // Wire pipeline stepper
  document.querySelectorAll('.pipeline-step').forEach(step => {
    step.addEventListener('click', () => {
      window.AmigoMap.crm.setStatus(school.id, step.dataset.status);
      window.AmigoMap.markers.refreshMarker(school.id);
      renderDetailContent(school);
      window.AmigoMap.filters.applyFilters();
    });
  });

  // Wire notes auto-save
  document.getElementById('notes-field').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.AmigoMap.crm.setNotes(school.id, e.target.value);
    }, 500);
  });
  document.getElementById('visit-notes-field').addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      window.AmigoMap.crm.setVisitNotes(school.id, e.target.value);
    }, 500);
  });

  // Wire add POC
  document.getElementById('add-poc-btn').addEventListener('click', () => showPocForm(school));

  // Wire POC actions
  document.querySelectorAll('.remove-poc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pocId = e.target.closest('.poc-card').dataset.pocId;
      window.AmigoMap.crm.removePoc(school.id, pocId);
      renderDetailContent(school);
    });
  });
  document.querySelectorAll('.mark-contacted').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pocId = e.target.closest('.poc-card').dataset.pocId;
      window.AmigoMap.crm.updatePoc(school.id, pocId, { lastContacted: new Date().toISOString() });
      renderDetailContent(school);
    });
  });
  document.querySelectorAll('.edit-poc').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pocId = e.target.closest('.poc-card').dataset.pocId;
      const poc = crm.poc.find(p => p.id === pocId);
      if (poc) showPocForm(school, poc);
    });
  });
}

function showPocForm(school, existingPoc = null) {
  const area = document.getElementById('poc-form-area');
  area.innerHTML = `
    <div class="poc-form">
      <input type="text" id="poc-name" placeholder="Name" value="${existingPoc?.name || ''}" />
      <input type="text" id="poc-title" placeholder="Title (e.g., Athletic Director)" value="${existingPoc?.title || ''}" />
      <div class="form-row">
        <input type="email" id="poc-email" placeholder="Email" value="${existingPoc?.email || ''}" />
        <input type="tel" id="poc-phone" placeholder="Phone" value="${existingPoc?.phone || ''}" />
      </div>
      <label style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-top:4px;margin-bottom:2px">Last contacted</label>
      <input type="date" id="poc-last-contacted" value="${existingPoc?.lastContacted ? existingPoc.lastContacted.slice(0,10) : ''}" />
      <div style="display:flex;gap:6px;margin-top:6px">
        <button class="btn-primary" id="save-poc">${existingPoc ? 'Update' : 'Add'} Contact</button>
        <button class="btn-ghost" id="cancel-poc">Cancel</button>
      </div>
    </div>`;

  document.getElementById('save-poc').addEventListener('click', () => {
    const dateVal = document.getElementById('poc-last-contacted').value;
    const poc = {
      name: document.getElementById('poc-name').value,
      title: document.getElementById('poc-title').value,
      email: document.getElementById('poc-email').value,
      phone: document.getElementById('poc-phone').value,
      lastContacted: dateVal ? new Date(dateVal + 'T12:00:00').toISOString() : (existingPoc?.lastContacted || null),
    };
    if (existingPoc) {
      window.AmigoMap.crm.updatePoc(school.id, existingPoc.id, poc);
    } else {
      window.AmigoMap.crm.addPoc(school.id, poc);
    }
    renderDetailContent(school);
  });
  document.getElementById('cancel-poc').addEventListener('click', () => { area.innerHTML = ''; });
}

function initSidebar() {
  // Back button
  document.getElementById('back-to-list').addEventListener('click', () => {
    document.getElementById('detail-view').classList.add('hidden');
    document.getElementById('list-view').classList.remove('hidden');
    currentSchool = null;
  });
  document.getElementById('back-from-visit').addEventListener('click', () => {
    document.getElementById('visit-view').classList.add('hidden');
    document.getElementById('list-view').classList.remove('hidden');
  });

  // Search
  document.getElementById('school-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = window.AmigoMap.filters.getFilteredSchools().filter(s =>
      s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q) || s.conference.toLowerCase().includes(q)
    );
    renderList(filtered);
  });

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      renderList(window.AmigoMap.filters.getFilteredSchools());
    });
  });
}

window.AmigoMap.sidebar = { initSidebar, renderList, showDetail };
