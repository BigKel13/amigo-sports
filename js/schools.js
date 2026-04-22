/* ═══════════════════════════════════════
   School Markers & Clustering
   ═══════════════════════════════════════ */
window.AmigoMap = window.AmigoMap || {};

let clusterGroup = null;
const markerMap = {}; // schoolId -> L.marker

function getLogoUrl(school) {
  if (school.espnId) return `https://a.espncdn.com/i/teamlogos/ncaa/500/${school.espnId}.png`;
  return null;
}

function getInitials(name) {
  return name.replace(/^(University of |The |College of )/i, '')
    .split(/[\s-]+/).filter(w => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 3).map(w => w[0]).join('');
}

function createSchoolIcon(school) {
  const crm = window.AmigoMap.crm.getCrmState(school.id);
  const color = window.AmigoMap.crm.getStatusColor(crm.status);
  const logoUrl = getLogoUrl(school);
  const initials = getInitials(school.name);

  const imgHtml = logoUrl
    ? `<img src="${logoUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
    : '';

  return L.divIcon({
    className: 'school-marker',
    html: `<div class="marker-ring" style="border-color:${color}" data-school-id="${school.id}">
      ${imgHtml}
      <div class="marker-fallback" style="${logoUrl ? 'display:none' : 'display:flex'}">${initials}</div>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function createSchoolMarker(school) {
  const marker = L.marker([school.lat, school.lng], { icon: createSchoolIcon(school) });
  marker.schoolId = school.id;
  marker.school = school;
  marker.on('click', () => {
    window.AmigoMap.sidebar.showDetail(school);
  });
  markerMap[school.id] = marker;
  return marker;
}

function refreshMarker(schoolId) {
  const marker = markerMap[schoolId];
  if (!marker) return;
  const school = window.AmigoMap.schools.find(s => s.id === schoolId);
  if (!school) return;
  marker.setIcon(createSchoolIcon(school));
}

function initClusterGroup(map) {
  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 45,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    animate: true,
    iconCreateFunction: function (cluster) {
      const markers = cluster.getAllChildMarkers();
      const count = markers.length;
      const statusCounts = {};
      markers.forEach(m => {
        const crm = window.AmigoMap.crm.getCrmState(m.schoolId);
        statusCounts[crm.status] = (statusCounts[crm.status] || 0) + 1;
      });

      // Find dominant status color
      let maxStatus = 'not_started', maxCount = 0;
      Object.entries(statusCounts).forEach(([status, cnt]) => {
        if (cnt > maxCount) { maxCount = cnt; maxStatus = status; }
      });
      const color = window.AmigoMap.crm.getStatusColor(maxStatus);
      const sizeClass = count > 20 ? 'lg' : count > 5 ? '' : 'sm';

      return L.divIcon({
        className: 'school-cluster',
        html: `<div class="cluster-icon ${sizeClass}" style="background:${color}">${count}</div>`,
        iconSize: [40, 40]
      });
    }
  });
  map.addLayer(clusterGroup);
  return clusterGroup;
}

function renderMarkers(schools) {
  if (!clusterGroup) return;
  clusterGroup.clearLayers();
  Object.keys(markerMap).forEach(k => delete markerMap[k]);
  schools.forEach(school => {
    const marker = createSchoolMarker(school);
    clusterGroup.addLayer(marker);
  });
}

function flyToSchool(schoolId, map) {
  const school = window.AmigoMap.schools.find(s => s.id === schoolId);
  if (school) {
    map.flyTo([school.lat, school.lng], 12, { duration: 0.8 });
    // Highlight marker
    const marker = markerMap[schoolId];
    if (marker) {
      const ring = document.querySelector(`.marker-ring[data-school-id="${schoolId}"]`);
      if (ring) {
        ring.classList.add('pulse');
        setTimeout(() => ring.classList.remove('pulse'), 3000);
      }
    }
  }
}

window.AmigoMap.markers = {
  initClusterGroup, renderMarkers, refreshMarker, flyToSchool, getLogoUrl, getInitials, markerMap
};
