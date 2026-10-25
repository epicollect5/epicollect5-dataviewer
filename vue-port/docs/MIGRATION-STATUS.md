# Vue Port Migration Status

## Phase Status

- Phase 1: complete
- Phase 2: complete for datetime, entries, upload parsing, and shared helpers
- Phase 3: complete for the main table vertical slice
- Phase 4: complete for the bulk upload slice
- Phase 5: complete for the first map slice
- Phase 6: in progress — hierarchy navigation, child/branch entries and their data-editor restore round trips are done, including edit entry, delete gating, the navbar add action, the branch-exit view, the drawer actions and the map restore payload; media download and the legacy map sliders remain

## Current Parity

- Project bootstrap, form switching, table pagination, title/date/order filters, and AG Grid table rendering are implemented.
- Bulk upload supports CSV preparation, sequential upload, per-row error rows, failed-only filtering, failed-row CSV export, and table refresh after close.
- Map view supports form switching, location-question selection, date filtering, and Leaflet rendering. Clustering uses the legacy `leaflet.markercluster` behavior, and clicking a marker opens the entry drawer with its media sections.
- Downloads are implemented: the drawer builds mapping/timeframe/format zips through `API_DOWNLOAD_ENDPOINT`, the table exports the filtered subset through `API_DOWNLOAD_SUBSET_ENDPOINT`, and both reuse the legacy request-cookie handshake.
- Ionic shell now hosts modal, toast, drawer, and wait-overlay layers in one place.
- Form hierarchy navigation is implemented: the child count cell loads the entries of the next form for the selected parent entry, the secondary navbar links back to the immediate parent, and the primary navbar brand links back to the first form.
- Add child entry is implemented as the legacy data-editor round trip: the plus cell saves restore params to `localStorage` (`epicollect5-restore`), opens `DATA_EDITOR_ADD_ENTRY_PATH` with `form_ref`/`parent_form_ref`/`parent_uuid`, and `?restore=1` on the way back rebuilds the saved view (hierarchy, filters, page). The plus is shown to logged-in project users, with a development bypass.
- Saved restore params are only honoured when they belong to the loaded project, point at forms the project still has, and are younger than 30 minutes; they are cleared once the restored table page loads.
- Edit entry is the same round trip: the Edit cell saves the view being left (hierarchy, branch scope, filters, page) and opens `DATA_EDITOR_EDIT_ENTRY_PATH` with the row's `uuid` added to the current list query. The cell is enabled for project roles in `USER_PERMISSIONS.CAN_EDIT` or for the entry's own owner, never for a `VIEWER`, with the development bypass. Delete is gated by the same rule in the cell and again in the confirmation modal, which refuses to call the API for an entry the project user may not touch.
- The secondary navbar offers the legacy "Add {form}" / "Add {branch}" action: it adds to whatever the table is scoped to (the current form, the parent entry of a child view, or the owner entry of a branch view), labelled with the form name or the branch question, and hidden for `VIEWER` roles, logged-out users and forms with no questions.
- Branch navigation is implemented: a branch count cell opens that entry's branch entries in the same table (branch headers and rows, `branch_ref`/`branch_owner_uuid` requests, no children column), the secondary navbar shows the owner entry title and branch question with a back button, branch pagination and filters stay branch-scoped, the in-cell plus opens the data editor for a branch entry, and `?restore=1` rebuilds the branch view. Leaving a branch returns to the owner form's filters and page rather than a fresh page 1: the view is snapshotted when the branch opens (or taken from the restore blob), falling back to a reset when there is none.
- The map entry drawer parses the clicked entry with the form the locations were loaded for (legacy `locationFormRef`), so a map restored onto the hierarchy root form still labels its entries correctly while the table shows a child form.
- The map entry drawer carries the same Edit and Delete actions as the grid rows, gated by the same role/ownership rule. Edit runs the data-editor round trip from the locations query, and the restore blob records `activePage` plus the map view (selected location question, distribution question, timeframe), so the viewer comes back to the map page on the same question and dates rather than the table and the map defaults. Delete uses the shared, gated delete modal, which then closes the entry drawer and refreshes the map markers.
- Grid offsets, view payloads and delete payloads are derived from each row's own cell data, so hierarchy tables, branch tables (one fixed cell fewer) and child tables all render and act on the right cells.

## Known Gaps

- Media download is not ported: legacy downloads a media zip through `API_DOWNLOAD_MEDIA_ENDPOINT` with its own request-cookie/timestamp polling, and the port only covers the entry and subset zips.
- The legacy map-control sliders are not ported: the port filters the map by the timeframe instead, so there is no slider state to save or replay, and the pie chart parameters are derived from the distribution question and the loaded locations rather than stored.
- Styling is aligned at shell/layout level, not pixel-matched against every legacy screen.

## Risk Notes

- AG Grid and Ionic remain the largest bundles. Route-level splitting is in place, but vendor chunks are still large.
- Upload and map behavior rely on fixture-light smoke coverage: the integration tests stub the API layer, so a green suite does not prove a live project loads, drills, adds, deletes or downloads.
- The add-child, add-branch, navbar-add and edit round trips share one `localstorage` key, so whichever action ran last owns the restore blob, and any legacy-written blob can occupy that key. The map view is read from the port's nested `mapView` field only, so a blob written by the legacy app restores the page but not the map question or timeframe.
- Branch state lives on the navigation store, so a branch scope must be cleared by any navigation move; `setCurrentForm`, `enterChildForm`, `navigateBack` and `resetHierarchy` all do it.
- The owner view replayed when a branch is left is a snapshot of page and filters, so entries deleted while the branch was open can leave the replayed page empty; there is no fallback to the last non-empty page.
- A branch opened from another branch keeps the outer owner snapshot, so leaving it returns straight to that owner form rather than to the intermediate branch.
- The map view is replayed by whichever page bootstraps after the restore seeds it. If the map has already loaded when the seed arrives, the view stays on its defaults — there is no re-load trigger — and a timeframe restored outside the project's current date bounds simply filters every marker out.
- Restoring is validated against the loaded project and the forms that still exist, but a project edited in the data editor between the two halves of a round trip (a form renamed, removed or reordered) can still land on a page the saved blob no longer describes; validation rejects the form refs it knows about, not a reshaped form.

## Next Recommended Steps (easiest first)

Pick 1–3 for one sitting; each reuses machinery that already exists rather than adding a new flow.

1. **API-backed integration pass** (medium) — one real-request smoke run (load project, page, drill into a child, enter and leave a branch, add and edit round trips) behind an env flag, so the port is verified against a live backend rather than stubs.
2. **Styling parity pass** (large) — walk the legacy table, map, download, upload and drawer screens and align spacing, typography and breakpoints.

## Current Structure Target

The Vue port is organized under:

- `components/`
- `composable/`
- `pages/`
- `router/`
- `stores/`
- `services/api/`
- `services/upload/`
- `services/entries/`
- `core/`
- `utils/`
- `theme/`
- `tests/`
