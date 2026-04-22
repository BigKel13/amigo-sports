/* ═══════════════════════════════════════
   App Init — Amigo Sports D1 Map
   ═══════════════════════════════════════ */
(function () {
  'use strict';

  // Initialize map
  const map = L.map('map', {
    center: [39.8283, -98.5795],
    zoom: 5,
    minZoom: 3,
    maxZoom: 18,
    zoomControl: false,
    attributionControl: false
  });

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  // Expose map globally
  window.AmigoMap.map = map;

  // Wait for DOM + data
  function init() {
    if (!window.AmigoMap.schools || window.AmigoMap.schools.length === 0) {
      console.warn('No school data loaded. Waiting...');
      setTimeout(init, 100);
      return;
    }

    console.log(`Amigo Sports Map — ${window.AmigoMap.schools.length} schools loaded`);

    // Init cluster group
    window.AmigoMap.markers.initClusterGroup(map);

    // Init modules
    window.AmigoMap.filters.initFilters();
    window.AmigoMap.sidebar.initSidebar();
    window.AmigoMap.visitPlanner.initVisitPlanner();
    window.AmigoMap.export.initExport();

    // Initial render
    window.AmigoMap.filters.applyFilters();

    // Pipeline stat click — filter by status
    document.querySelectorAll('.pipe-stat').forEach(stat => {
      stat.addEventListener('click', () => {
        const status = stat.dataset.status;
        // Toggle: if only this status is active, show all; otherwise show only this
        const statusChips = document.querySelectorAll('#status-filters .chip:not([data-status="all"])');
        const allKeys = window.AmigoMap.crm.PIPELINE.map(p => p.key);

        // Check if only this status is currently active
        const onlyThisActive = window.AmigoMap.filters.getFilteredSchools().every(s => {
          const crm = window.AmigoMap.crm.getCrmState(s.id);
          return crm.status === status;
        });

        // Reset all status filters then activate just this one
        statusChips.forEach(chip => {
          const key = chip.dataset.status;
          if (key === status) chip.classList.add('active');
          else chip.classList.remove('active');
        });
        document.querySelector('#status-filters [data-status="all"]').classList.remove('active');

        // Trigger filter update through the chip click handler
        // For simplicity, directly call applyFilters here
        window.AmigoMap.filters.applyFilters();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
