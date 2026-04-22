# Amigo Sports — D1 Prospecting Map

Interactive CRM and prospecting map for all **359 NCAA Division I athletic programs** across the U.S. Built for the Amigo Sports AE team.

## Live Demo

Once GitHub Pages is enabled on this repo, the app lives at:
`https://<username>.github.io/amigo-sports/`

## What it does

- **Interactive Leaflet map** — every D1 program dropped at its campus coordinates with its ESPN logo as the pin, ringed by its current pipeline color.
- **CRM pipeline tracking** — 6 stages per school (Not Started → Outreach → In Contact → Visited → Proposal → On Board). State persists in `localStorage`, so notes and pipeline moves survive reloads.
- **Points of contact** — add/edit/remove POCs per school (name, title, email, phone).
- **Notes** — general notes + separate visit notes per school, auto-saved with debounce.
- **Filters** — region (North/South/East/West), conference (with Power vs. Mid-Major grouping and search), pipeline status, public/private, FBS/FCS/D1.
- **Pipeline stats** — click any stat in the top bar to filter the map to just that stage.
- **Visit planner** — proximity-groups schools within 100 miles, lets you select multiple, draws a west→east route polyline, and copies a formatted itinerary to your clipboard.
- **Export** — pull everything (school metadata + your CRM state) down as CSV or JSON.

## Data

`js/data.js` contains all 359 D1 schools with:

- Name, city, state, lat/lng
- Conference, region, subdivision (FBS / FCS / D1)
- Type (public / private), number of varsity sports
- Endowment ($B), NIL annual estimate ($M)
- ESPN team ID (for logo rendering)

Breakdown: **132 FBS**, **125 FCS**, **102 D1 non-football**. Regions: South 151, East 82, North 76, West 50.

## Architecture

Pure vanilla JS, no build step. Each concern is one file:

```
index.html           — shell + script load order
css/styles.css       — dark theme, markers, pipeline stepper
js/data.js           — 359-school dataset
js/crm.js            — localStorage pipeline + POC + notes
js/schools.js        — map markers, clustering, logo fallback
js/filters.js        — filter chips + conference dropdown
js/sidebar.js        — school list + detail panel
js/visit-planner.js  — proximity grouping + route drawing
js/export.js         — CSV / JSON export
js/app.js            — map init + DOM wire-up
```

Everything hangs off `window.AmigoMap` — `schools`, `crm`, `markers`, `filters`, `sidebar`, `visitPlanner`, `export`.

## Adding D3 schools

The data schema already supports division-agnostic records. To add D3 in one pass:

1. Append D3 records to `js/data.js` with `subdivision: "D3"`.
2. Add a `D3` chip to `#subdiv-filters` in `index.html`.
3. Add `'D3'` to the default set in `js/filters.js` (`activeSubdivs`).

That's it — markers, filters, pipeline, export, and visit planning all work unchanged.

## Running locally

Any static server works. From the project root:

```bash
python3 -m http.server 8090
# open http://localhost:8090
```

Or just double-click `index.html`.
