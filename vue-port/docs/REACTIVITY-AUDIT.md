# Reactivity & Store Reference Audit — Vue Port

Audit of unnecessary reactivity and redundant store references across `vue-port/src/`.

**Scope** — every component in `src/components/**` and `src/pages/**` that declares `const state = reactive({...})`,
plus all nine Pinia stores in `src/stores/`. Legacy `app/**` is out of scope.

**Method** — for each component: scripted comparison of the `state` keys against the places that can actually
observe them (the `<template>`, `computedScope`, and the rest of the script), plus a manual read of the stores
that hold API payloads. A temporary probe test was run to establish what `reactive()` really does to the
values put inside it; its output is quoted in **What is already right** and the probe was then deleted.

## Verdict

| Question | Answer |
|---|---|
| Are the big read-only collections still deeply reactive? | **Mostly no** — table rows, project payloads and map locations are `markRaw`ed. Two payloads were missed: `mapStore.selectedEntry` and the whole bulk-upload dataset. |
| Is reactivity used for values nothing renders? | **Yes**, in 9 components — internal flags, timers and DOM/instance refs sit in `reactive()` although no template or computed ever reads them. |
| Are store references redundant in component state? | **Yes**, in 9 components — 20 store entries in `state` are never read through `state`, so they are pure noise (they cost nothing: a store is not double-wrapped, see below). |
| Are any store fields dead? | **Two**: `mapStore.markers` (only tests read it) and `projectStore.entriesExtra` (never written, never read). |
| Is anything watching data deeply? | **No** — there is no `deep: true` watcher anywhere in `src/`. |

Severity: **R1–R4 are worth doing** (dead or unnecessarily heavy state), **R5–R6 are cheap consistency
cleanups**, **R7–R9 are optional polish**.

---

## What is already right (no action)

This is context for the findings, not a to-do list.

- **Table rows are deliberately non-reactive.** `tableStore` keeps the ag-grid rows in a module-level
  `tableRowsContext` object (`markRaw`) and exposes them through a getter keyed on the reactive counter
  `rowsVersion` (`tableStore.js:22-44`, `:104-124`). The grid receives the raw array, renders it, and nothing
  mutates rows in place — edits happen in the data editor. This is the pattern the rest of the audit measures
  against.
- **Project payloads are `markRaw`ed** (`projectStore.js:81-85`) and **map collections use `rawArray`**
  (`mapStore.js:37`, `:105-108`).
- **Leaflet objects are `markRaw`ed and the map's working state is a plain closure object**, not `reactive()`
  (`MapLeaflet.vue:78-101`, `:118-135`, `:923`).
- **No `deep: true` watcher** exists; `MapLeaflet.vue:943` watches `() => props.locations`, i.e. identity only,
  which is what a replaced-on-every-load array needs.
- **DOM nodes are not proxied by `reactive()`** — the probe printed
  `dom element proxied: false` (`holder.element === element`). `Object.prototype.toString` on an
  `HTMLInputElement` is `[object HTMLInputElement]`, which Vue's target-type map rejects, so
  `reactive({ fileInput })` stores the element itself. The same probe showed a store is not double-wrapped:
  `state.tableStore === tableStore` was `true`, and `toRaw(state.tableStore) === toRaw(tableStore)` was `true`.
  **So R2 costs nothing at runtime** — it is a readability finding, not a performance one. State that honestly
  instead of "every store in state is a wasted proxy".

---

## Findings

### R1 — `mapStore.markers` is dead state that duplicates `filteredLocations`

**Severity: high (dead state, easy delete).**

`recomputeMarkers()` assigns the *same array instance* to both fields:

```js
//mapStore.js:378-381
const rawVisibleLocations = rawArray(nextVisibleLocations);

this.filteredLocations = rawVisibleLocations;
this.markers = rawVisibleLocations;
```

Nothing in production reads `markers`: `PageMap` renders `mapStore.visibleLocations` (`PageMap.vue:80`), and the
`visibleLocations` getter reads `filteredLocations` (`mapStore.js:137`). The only readers are tests —
`tests/unit/stores/mapStore.test.js:148,151,184` and `tests/integration/pageMap.smoke.test.js:103`.

**Recommendation** — delete `markers` from state (`:108`) and from its four assignment sites (`:176`, `:335`,
`:381`, `:543`), keeping `filteredLocations`. Rename nothing else: `visibleLocations` already means "what the
map should draw". Update the two test files; in `pageMap.smoke.test.js:103` the assignment should become
`mapStore.filteredLocations`. Effort: S.

### R2 — 20 store entries in component `state` are never read

**Severity: low (clarity), but it is the pattern the request was about.**

Stores are listed in `state` so templates can read them. These are never read through `state` at all — only
through the `setup()` local const in methods:

| Component | Store entries in `state` that nothing reads via `state` |
|---|---|
| `NavbarPrimary.vue` | `drawerStore`, `tableStore`, `mapStore`, `modalStore` |
| `ModalUpload.vue` | `modalStore`, `projectStore`, `tableStore`, `toastStore` |
| `PageTable.vue` | `filtersStore`, `mapStore`, `drawerStore` (and `toastStore`, added by the restore fallback) |
| `DrawerUpload.vue` | `modalStore`, `filtersStore`, `toastStore` |
| `DrawerEntry.vue` | `projectStore`, `navigationStore`, `mapStore` |
| `PageMap.vue` | `drawerStore` |
| `ModalDeleteEntry.vue` | `modalStore` |
| `ModalWrapper.vue` | `modalStore` |

`ModalMediaViewer`, `DrawerMap`, `ToastWrapper`, `OverlayWait`, `DrawerWrapper` list none, so the "worked
example" already exists.

**Recommendation** — keep a store in `state` only when the template renders it (`state.tableStore.isRejectedPage`
in `PageTable`, `state.projectStore` in `NavbarPrimary`, `state.mapStore` in `PageMap`); drop the rest and use
the local const in the script. Do not add an "all stores in state" helper — it would hide which store a
template actually depends on. Effort: S, mechanical, no behaviour change.

### R3 — the bulk-upload dataset is deeply reactive, row by row

**Severity: high at scale — the largest read-only payload in the app.**

```js
//uploadStore.js:10-17
uploadedRows: [],          // one object per CSV row, one key per column
bulkUploadableHeaders: [],
reverseEntries: [],        // one API-shaped entry per row
reverseMapping: [],
generatedUuids: [],
uploadResults: [],         // one response per uploaded row
```

None are `markRaw`ed. Unlike the table and map stores, this data is only ever assigned wholesale — the
per-row mutations happen on locals inside `services/upload/uploadWorkflow.js:174,227`, `uploadStore.js:101-105`
assigns the prepared arrays in one go, and `:130` swaps in each batch's results. So the store is a pure
consumer of already finished arrays, exactly like the table rows.

At a few thousand rows this is the difference between Pinia holding references and Pinia holding a proxy graph
over every cell, kept alive for the whole upload session; `pairedRows` (`uploadStore.js:34-42`) then walks the
whole set again on every invalidation, and `ModalUpload.vue:179` slices pages out of it for a grid that shows
~10 rows.

**Recommendation** — `markRaw` the six arrays at every assignment (`prepareFile`, `uploadPreparedEntries`,
`reset`), or wrap them with a `rawArray` helper as `mapStore.js:37` does. Keeping them in state is fine; the
identity change on assignment is what the progress UI watches (`ModalUpload.vue:190-192`). Add a regression
note to `tests/unit/stores/uploadStore.test.js` that the arrays stay raw. Effort: S/M.

### R4 — `mapStore.selectedEntry` is the one API payload left deeply reactive

**Severity: medium (inconsistency + cost on read).**

`mapStore.js:580` — `this.selectedEntry = response.data;` — a whole entry payload (answers, attributes,
relationships) entered into reactive state unproxied-free, while `projectStore.js:81-85` `markRaw`s payloads and
`mapStore.js:105-108` raw-arrays collections. The `selectedEntryTitle` getter then runs `tableModel.getRows(...)`
over it on every read (`mapStore.js:139-166`), a parse that is not memoised.

Nothing mutates `selectedEntry`; the drawer only parses it (`DrawerEntry.vue:245,254`), and the tests assign it
whole (`tests/unit/components/drawerEntry.test.js:38`).

**Recommendation** — `markRaw(response.data)` at `:580`. Consider memoising `selectedEntryTitle` in a
component-level computed instead of a store getter, or leaving the getter alone once the payload is raw.
Effort: S.

### R5 — `projectStore.entriesExtra` is never written or read

**Severity: low (dead state).**

Declared at `projectStore.js:44`, referenced nowhere else in `src/` — the other `entriesExtra` hits are just a
parameter name in `core/entries/tableModel.js:106-108`. No test touches it.

**Recommendation** — delete the field. Effort: XS.

### R6 — internal flags, timers and refs parked in `reactive()`

**Severity: low (clarity; no measurable cost once R2's "stores are not double-wrapped" caveat is understood).**

These `state` keys are read only inside methods — never by a template, never by a computed — so their reactivity
is never observed. Several are not UI data at all:

| File | Keys | What they actually are |
|---|---|---|
| `MapLeaflet.vue:105-110` | `activeBaseLayer`, `activeOverlay`, `hasInvalidatedInitialSize`, `clusterRenderStartedAt`, `lastCanShowMarkersOverlay`, `activeRenderToken` | render bookkeeping; the layer controls are Leaflet-built, so no Vue template reads the selection |
| `DrawerMap.vue:195-197` | `debounceTimer`, `activeTimelineKnobPosition`, `suppressTimelineEvents` | a `setTimeout` id and two event-suppression flags |
| `NavbarPrimary.vue:147-148` | `downloadCookieInterval`, `downloadNavigationTimeout` | two timer ids |
| `ModalPhotoViewer.vue:40` | `pollTimer` | a timer id |
| `ModalMediaViewer.vue:63` | `mediaElement` | a `<video>`/`<audio>` DOM node |
| `DrawerUpload.vue:117` | `fileInput` | an `<input type="file">` DOM node |
| `PageMap.vue:138` | `leafletMap` | the `MapLeaflet` component instance behind a template ref |
| `DrawerEntry.vue:142` | `loadedThumbs` | a keyed "already loaded" lookup, rebuilt by spread |

No test asserts any of these through `state` (checked), so moving them is safe.

**Recommendation** — move them into a plain closure object alongside `setup()` (the `mapContext` pattern in
`MapLeaflet.vue:78-101`) when the surrounding code is next touched, and keep `reactive()` for what the template
renders. Do **not** do a sweeping pass just for this: the runtime cost is nil and the diff would be large.
Effort: S per file, optional.

### R7 — static config objects in `reactive()`

`GridEntries.vue:66` / `GridUpload.vue:42` (`defaultColDef`) and `ToolbarTable.vue:140` (`orderOptions`) are
constants built once from `PARAMETERS` and never reassigned. They are exposed through `state` because the
template reads `state.defaultColDef` / `state.orderOptions`.

**Recommendation** — when these files are touched, expose them as a plain const (the same shape as the `...icons`
group the components already return) instead of reactive state. Effort: XS, cosmetic.

### R8 — the table-row plumbing has one redundant derived field

`rowCount` (`tableStore.js:105`, set at `:232`) is exactly `gridRows.length` — the setter returns the length of
the array it just stored. And `getCachedRows(rowsVersion, rows)` (`:42-46`) exists only to give the getter a
reactive dependency; its `rowsVersion < 0` branch is unreachable.

**Recommendation** — if this area is opened anyway: assign `state.gridRows = markRaw(...)` in `setTableRows` and
drop both `rowCount` and the version counter, replacing `state.tableStore.rowCount === 0` (`PageTable.vue:106`)
with `state.tableStore.gridRows.length === 0`. Purely optional; the current shape works and is documented by its
own comment. Effort: S with mild churn.

### R9 — the hidden map panel keeps evaluating

`PageData.vue` mounts both panels and toggles them with classes (`page-data__panel--active`) under a
`keep-alive include="PageData"` (`App.vue`). So while the table is displayed, `PageMap`'s computeds
(`locationCacheKey`, `pieChartLegend`, `distributionQuestions`, `showMapLoader`) and `MapLeaflet`'s prop
watchers still run against their dependencies, and `MapLeaflet`'s template (a single `<div>`) still re-renders.

**Recommendation** — leave it: the point of keeping the map mounted is to preserve Leaflet state and the map
camera across a tab switch, and `isActive`/`isHidden` props already gate the expensive work. Recorded here only
so a future "why is the map doing work on the table page" question has an answer. Effort: none (documentation).

---

## Recommended order

1. **R1** delete `mapStore.markers` (dead duplicate) and **R5** delete `projectStore.entriesExtra` — smallest
   diff, real dead weight. Update 4 test references for R1.
2. **R3** `markRaw` the upload arrays — the largest genuinely unnecessary reactive graph in the port.
3. **R4** `markRaw(mapStore.selectedEntry)` — one line, closes the inconsistency with `projectStore`.
4. **R2** drop the 20 unread store entries from component `state` — mechanical, no behaviour change.
5. **R6** move internal flags/timers/refs out of `reactive()` file by file, only when the file is touched anyway.
6. **R7**, **R8** — only if those files are opened for another reason.

Nothing above changes rendered output, so a green unit + smoke suite is the expected result.

## Verification

Per step, the suites that pin the affected behaviour:

```bash
NODE_ENV=test npx vitest run src/tests/unit/stores/mapStore.test.js          # R1, R4
NODE_ENV=test npx vitest run src/tests/unit/stores/uploadStore.test.js       # R3
NODE_ENV=test npx vitest run src/tests/unit/stores/projectStore.test.js      # R5
NODE_ENV=test npx vitest run src/tests/integration/tableView.smoke.test.js \
  src/tests/integration/pageMap.smoke.test.js                                # R1, R2, R6, R8
NODE_ENV=test npm test                                                       # full suite
```

## Risks if the recommendations are taken

- **R1/R2/R4/R5 need the store to keep being written wholesale.** If any future code starts mutating these
  arrays or the selected entry in place (`push`, index assignment), `markRaw` will silently stop re-rendering.
  That is why R3's recommendation is tied to a test and not just to a `markRaw` call.
- **R2 must not remove a store the template reads indirectly** — e.g. through a computed that closes over the
  local const (fine) versus one that reads `state.store` (not fine). Re-run the smoke tests after each file.
- **R6 changes no behaviour but does move state out of the documented `state → methods → computedScope`
  grouping.** If the grouping rule is read strictly, the honest fix is to say in `CODE-STYLE.md` that
  non-rendered scratch lives in a closure object — the same kind of doc-versus-reality gap the style audit
  already recorded for the `...icons` group.
- **R8 rewrites the table row trigger.** It is the one recommendation that touches render invalidation for the
  main grid, so it should be done on its own, with the table smoke tests run before and after.

## Non-findings worth recording

- Small API metadata (`pagination`, `links`, `requestParams`, `selectedLocationQuestion`,
  `selectedDistributionQuestion`, `pendingMapRestore`) are plain objects in reactive state. They are tiny, they
  are read by templates, and they are replaced wholesale — leave them alone.
- `GridEntries.rowData` (`GridEntries.vue:79`) is `computed(() => props.rows)`, a pass-through: it exists so
  ag-grid sees a stable property name. Not worth changing.
- Component computeds that mirror store fields (`PageMap.entriesTotal`, `currentPage`, `lastPage`) are read by
  the template, so they are derived UI values, not duplicate state.
