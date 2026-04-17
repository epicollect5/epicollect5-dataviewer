# Vue Port Migration Status

## Phase Status

- Phase 1: complete
- Phase 2: complete for datetime, entries, upload parsing, and shared helpers
- Phase 3: complete for the main table vertical slice
- Phase 4: complete for the bulk upload slice
- Phase 5: complete for the first map slice
- Phase 6: in progress, current parity work documented below

## Current Parity

- Project bootstrap, form switching, table pagination, title/date/order filters, and AG Grid table rendering are implemented.
- Bulk upload supports CSV preparation, sequential upload, per-row error rows, failed-only filtering, failed-row CSV export, and table refresh after close.
- Map view supports form switching, location-question selection, date filtering, grouped coordinate markers, and Leaflet rendering.
- Ionic shell now hosts modal, toast, drawer, and wait-overlay layers in one place.

## Known Gaps

- Entry actions are still placeholders: view, edit, delete, child navigation, and branch navigation are not wired yet.
- Map marker interaction is limited to popup text. Legacy drawer-entry flows and richer marker overlays are not ported.
- The map “clusters” toggle currently groups identical coordinates instead of using the legacy cluster plugin behavior.
- Download flows and subset-selection parity are not implemented yet.
- Styling is aligned at shell/layout level, not pixel-matched against every legacy screen.

## Risk Notes

- AG Grid and Ionic remain the largest bundles. Route-level splitting is in place, but vendor chunks are still large.
- Upload and map behavior rely on fixture-light smoke coverage; full API-backed integration coverage is still missing.
- Legacy restore flows and local-storage-based deep resume behavior are only partially represented in the current stores.
