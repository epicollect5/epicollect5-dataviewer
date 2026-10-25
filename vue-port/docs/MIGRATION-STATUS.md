# Vue Port Migration Status

## Phase Status

- Phase 1: complete
- Phase 2: complete for datetime, entries, upload parsing, and shared helpers
- Phase 3: complete for the main table vertical slice
- Phase 4: complete for the bulk upload slice
- Phase 5: complete for the first map slice
- Phase 6: in progress — hierarchy navigation, child/branch entries and their data-editor restore round trips are done, including edit entry; delete gating, drawer actions and the map restore payload remain

## Current Parity

- Project bootstrap, form switching, table pagination, title/date/order filters, and AG Grid table rendering are implemented.
- Bulk upload supports CSV preparation, sequential upload, per-row error rows, failed-only filtering, failed-row CSV export, and table refresh after close.
- Map view supports form switching, location-question selection, date filtering, and Leaflet rendering. Clustering uses the legacy `leaflet.markercluster` behavior, and clicking a marker opens the entry drawer with its media sections.
- Downloads are implemented: the drawer builds mapping/timeframe/format zips through `API_DOWNLOAD_ENDPOINT`, the table exports the filtered subset through `API_DOWNLOAD_SUBSET_ENDPOINT`, and both reuse the legacy request-cookie handshake.
- Ionic shell now hosts modal, toast, drawer, and wait-overlay layers in one place.
- Form hierarchy navigation is implemented: the child count cell loads the entries of the next form for the selected parent entry, the secondary navbar links back to the immediate parent, and the primary navbar brand links back to the first form.
- Add child entry is implemented as the legacy data-editor round trip: the plus cell saves restore params to `localStorage` (`epicollect5-restore`), opens `DATA_EDITOR_ADD_ENTRY_PATH` with `form_ref`/`parent_form_ref`/`parent_uuid`, and `?restore=1` on the way back rebuilds the saved view (hierarchy, filters, page). The plus is shown to logged-in project users, with a development bypass.
- Saved restore params are only honoured when they belong to the loaded project, point at forms the project still has, and are younger than 30 minutes; they are cleared once the restored table page loads.
- Edit entry is the same round trip: the Edit cell saves the view being left (hierarchy, branch scope, filters, page) and opens `DATA_EDITOR_EDIT_ENTRY_PATH` with the row's `uuid` added to the current list query. The cell is enabled for project roles in `USER_PERMISSIONS.CAN_EDIT` or for the entry's own owner, never for a `VIEWER`, with the development bypass.
- Branch navigation is implemented: a branch count cell opens that entry's branch entries in the same table (branch headers and rows, `branch_ref`/`branch_owner_uuid` requests, no children column), the secondary navbar shows the owner entry title and branch question with a back button, branch pagination and filters stay branch-scoped, the in-cell plus opens the data editor for a branch entry, and `?restore=1` rebuilds the branch view.
- Grid offsets, view payloads and delete payloads are derived from each row's own cell data, so hierarchy tables, branch tables (one fixed cell fewer) and child tables all render and act on the right cells.

## Known Gaps

- The delete action is still ungated: legacy applies the same role/ownership rule as edit and disables the button, while the port's Delete cell is always enabled.
- The entry drawer has no edit or delete action yet, while legacy offers both there.
- The secondary navbar has no add buttons, so a branch entry can only be added from its owner entry's branch cell (legacy also offers "Add {form}" and "Add {branch}").
- Leaving a branch resets the filters and returns to page 1 of the owner form, while legacy replays the saved back link and keeps the page it was on.
- After a restore, the map holds the locations of the form the hierarchy started from (legacy `locationFormRef`), so the distribution questions drawn from the current child form can describe a different form than the markers.
- Media download is not ported: legacy downloads a media zip through `API_DOWNLOAD_MEDIA_ENDPOINT` with its own request-cookie/timestamp polling, and the port only covers the entry and subset zips.
- The map and entry-drawer restore payloads are not ported, so selecting a location question, a distribution question, the pie chart parameters or the map-control slider dates is lost after a data-editor round trip.
- Styling is aligned at shell/layout level, not pixel-matched against every legacy screen.

## Risk Notes

- AG Grid and Ionic remain the largest bundles. Route-level splitting is in place, but vendor chunks are still large.
- Upload and map behavior rely on fixture-light smoke coverage: the integration tests stub the API layer, so a green suite does not prove a live project loads, drills, adds, deletes or downloads.
- The add-child, add-branch and edit round trips share one `localstorage` key, so whichever action ran last owns the restore blob, and the legacy map and entry-drawer payloads are not ported: any legacy-written blob can occupy that key.
- Branch state lives on the navigation store, so a branch scope must be cleared by any navigation move; `setCurrentForm`, `enterChildForm`, `navigateBack` and `resetHierarchy` all do it.
- Restoring is validated against the loaded project and the forms that still exist, but a project edited in the data editor between the two halves of a round trip (a form renamed, removed or reordered) can still land on a page the saved blob no longer describes; validation rejects the form refs it knows about, not a reshaped form.

## Next Recommended Steps (easiest first)

Pick 1–3 for one sitting; each reuses machinery that already exists rather than adding a new flow.

1. **Gate the delete action** (small) — reuse `canEditEntryForProjectUser` for the Delete cell and the delete modal, mirroring legacy's role/ownership rule and its `VIEWER` override.
2. **Add buttons in the secondary navbar** (small) — "Add {form}" and "Add {branch}" through the existing add-entry/add-branch builders with no parent or branch overrides; hide them for `VIEWER` roles and for forms without questions, as legacy does.
3. **Keep the owner view when leaving a branch** (small) — snapshot `filtersStore` plus the page on `enterBranch` and replay both in `navigateBackFromBranch`, which also closes the last known hierarchy/branch gap.
4. **Edit and delete inside the entry drawer** (medium) — the drawer already holds the entry payload; wire the same edit round trip and the existing delete modal into it.
5. **Media download** (medium) — add the media zip endpoint to the download drawer with the legacy request-cookie/timestamp polling so the wait overlay dismisses when the file is ready.
6. **Map restore payload** (medium) — persist and restore the selected location question, distribution question, pie chart parameters and map-control slider dates, extending the restore validation to accept the map page.
7. **API-backed integration pass** (medium) — one real-request smoke run (load project, page, drill into a child, enter and leave a branch, add and edit round trips) behind an env flag, so the port is verified against a live backend rather than stubs.
8. **Styling parity pass** (large) — walk the legacy table, map, download, upload and drawer screens and align spacing, typography and breakpoints.

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
