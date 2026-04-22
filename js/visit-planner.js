/* ═══════════════════════════════════════
   Visit Planner — Proximity Grouping
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

let visitMode = false;
let selectedVisitSchools = new Set();
let routePolyline = null;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findProximityGroups(schools, radiusMiles = 100) {
  const visited = new Set();
  const groups = [];

  schools.forEach(school => {
    if (visited.has(school.id)) return;
    const group = [school];
    visited.add(school.id);

    schools.forEach(other => {
      if (visited.has(other.id)) return;
      const dist = haversineDistance(school.lat, school.lng, other.lat, other.lng);
      if (dist <= radiusMiles) {
        group.push(other);
        visited.add(other.id);
      }
    });

    groups.push(group);
  });

  return groups.filter(g => g.length > 1).sort((a, b) => b.length - a.length);
}

function renderVisitPlanner() {
  const schools = window.AmigoMap.filters.getFilteredSchools();
  const groups = findProximityGroups(schools);
  const container = document.getElementById('visit-groups');

  container.innerHTML = groups.map((group, gi) => {
    const centerCity = group[0].city;
    const centerState = group[0].state;
    return `<div class="visit-group">
      <div class="visit-group-header">${centerCity}, ${centerState} area (${group.length} schools)</div>
      ${group.map(school => {
        const dist = gi === 0 ? '' : '';
        const checked = selectedVisitSchools.has(school.id) ? 'checked' : '';
        return `<div class="visit-school-row">
          <input type="checkbox" value="${school.id}" ${checked} class="visit-cb" />
          <span>${school.name}</span>
        </div>`;
      }).join('')}
    </div>`;
  }).join('');

  if (groups.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:12px">No proximity groups found. Try adjusting filters to see more schools.</p>';
  }

  // Wire checkboxes
  container.querySelectorAll('.visit-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedVisitSchools.add(cb.value);
      else selectedVisitSchools.delete(cb.value);
      updateVisitRoute();
    });
  });
}

function updateVisitRoute() {
  const map = window.AmigoMap.map;
  if (routePolyline) { map.removeLayer(routePolyline); routePolyline = null; }

  const schools = [...selectedVisitSchools]
    .map(id => window.AmigoMap.schools.find(s => s.id === id))
    .filter(Boolean)
    .sort((a, b) => a.lng - b.lng); // West to east

  const selectedEl = document.getElementById('visit-selected');
  const copyBtn = document.getElementById('copy-itinerary');

  if (schools.length < 2) {
    selectedEl.innerHTML = '';
    copyBtn.classList.add('hidden');
    return;
  }

  // Draw polyline
  const latlngs = schools.map(s => [s.lat, s.lng]);
  routePolyline = L.polyline(latlngs, {
    color: '#1D9E75', weight: 3, opacity: 0.7, dashArray: '8,6'
  }).addTo(map);

  // Show itinerary
  let html = '<div style="padding:12px 16px"><h4 style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Route (West → East)</h4>';
  schools.forEach((school, i) => {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
      <span style="width:18px;height:18px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${i + 1}</span>
      <span style="font-size:12px">${school.name} — ${school.city}, ${school.state}</span>
    </div>`;
    if (i < schools.length - 1) {
      const dist = haversineDistance(school.lat, school.lng, schools[i + 1].lat, schools[i + 1].lng);
      html += `<div class="visit-distance" style="margin-left:26px">↓ ${Math.round(dist)} mi</div>`;
    }
  });
  html += '</div>';
  selectedEl.innerHTML = html;
  copyBtn.classList.remove('hidden');
}

function copyItinerary() {
  const schools = [...selectedVisitSchools]
    .map(id => window.AmigoMap.schools.find(s => s.id === id))
    .filter(Boolean)
    .sort((a, b) => a.lng - b.lng);

  let text = 'Amigo Sports — Visit Itinerary\n' + '='.repeat(40) + '\n\n';
  schools.forEach((school, i) => {
    text += `${i + 1}. ${school.name}\n   ${school.city}, ${school.state} | ${school.conference}\n`;
    if (i < schools.length - 1) {
      const dist = haversineDistance(school.lat, school.lng, schools[i + 1].lat, schools[i + 1].lng);
      text += `   → ${Math.round(dist)} mi to next stop\n`;
    }
    text += '\n';
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-itinerary');
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy Itinerary'; }, 2000);
  });
}

function initVisitPlanner() {
  document.getElementById('btn-visit-planner').addEventListener('click', () => {
    visitMode = !visitMode;
    document.getElementById('btn-visit-planner').classList.toggle('active', visitMode);

    if (visitMode) {
      document.getElementById('list-view').classList.add('hidden');
      document.getElementById('detail-view').classList.add('hidden');
      document.getElementById('visit-view').classList.remove('hidden');
      renderVisitPlanner();
    } else {
      document.getElementById('visit-view').classList.add('hidden');
      document.getElementById('list-view').classList.remove('hidden');
      if (routePolyline) { window.AmigoMap.map.removeLayer(routePolyline); routePolyline = null; }
      selectedVisitSchools.clear();
    }
  });

  document.getElementById('copy-itinerary').addEventListener('click', copyItinerary);
}

window.AmigoMap.visitPlanner = { initVisitPlanner };
