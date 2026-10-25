# Code Style Audit — Refactored Vue Port Code

Audit of the port's refactoring work (data-editor round trips, hierarchical/branch navigation, entry actions, map restore, drawer actions) against `vue-port/docs/CODE-STYLE.md`.

**Scope** — `services/entries/dataEditorFlow.js`, `services/entries/entriesGridColumns.js`, `services/entries/restoreFlow.js`, `core/entries/ag-grid/columnDefs.js`, `stores/tableStore.js`, `stores/mapStore.js`, `stores/navigationStore.js`, `stores/filtersStore.js`, `components/entry/DrawerEntry.vue`, `components/entry/ModalDeleteEntry.vue`, `components/table/GridEntries.vue`, `pages/PageTable.vue`, `pages/PageMap.vue` and the tests added or extended for them. Legacy `app/**` is out of scope (it is frozen and exempt).

**Method** — manual review against each rule in `CODE-STYLE.md`, plus scripted checks over `src/` for: `ref(`, relative imports, unbraced `if`/`for`/`while`, trailing commas, `var`, double-quoted literals, `console.*`, inline arrow functions and ternaries in templates, `...state` spreads, missing `<style src>`, and explicit Vitest imports. **ESLint could not be run** — see finding F5.

## Verdict

| Area | Result |
|---|---|
| `reactive()` only, no `ref()` | Pass |
| Grouped structure `state → methods → computedScope` | Pass, with one undocumented fourth group (`...icons`, F6) |
| No inline template logic / arrows | Pass (no arrows or ternaries in the refactored templates) |
| Business logic kept out of components | **Fail** (F1, F2, F3) |
| Imports via `@` alias | Pass (no relative imports in `src/`) |
| Style block per component, mirrored path | Pass |
| Braces on all control-flow bodies | Pass in refactored code (one pre-existing hit elsewhere) |
| Semicolons, single quotes, no trailing commas, `const` over `let`, no `var` | Pass in refactored code |
| Component option order (`name`, `components`, `props`, `emits`, `setup`) | Pass |
| Vitest only, `vi.*` | Pass |
| Explicit `from 'vitest'` imports in tests | **Fail**, 36 of 36 test files (F4) |
| Rules actually enforceable | **Fail** (F5) |

## Blocking

### F1 — Entry-drawer parsing and actions live in a component

`components/entry/DrawerEntry.vue`

- `:240-292` builds entry rows and headers with `tableModel.getRows` / `getHeaders` / `getBranchHeaders`, picks the form, computes the title/created-at offsets and slices the answers.
- `:278-290` extracts the entry uuid and the ownership (`relationships`) from the parsed cells — the same derivation the grid needs.
- `:160-200` `getAnswerKind` / `buildEntrySection` implement the answer→section mapping.
- `:202-212` `handleEdit` / `handleDelete` call the data-editor flow and open the delete modal.

Rule: *"Do not put business logic directly in components"*, *"Components orchestrate UI; they do not implement workflow logic"*, *"If code is dataviewer-specific transformation logic, put it in `core/`"*.

Suggested fix: move the row/section derivation to `services/entries/entryDrawer.js` (or `core/entries/drawerModel.js` for the pure part) exposing `buildEntryView({ projectExtra, projectSlug, formRef, entry, branchRef })` returning `{ title, createdAt, sections, entryUuid, attributes, relationships }`; keep the component to bindings plus `handleEdit`/`handleDelete` delegating to services. Effort: M.

### F2 — Delete workflow in the confirmation modal

`components/entry/ModalDeleteEntry.vue:88-118`

`confirmDelete` performs the permission gate, the delete request (through `tableStore`), the success toast, closing the map-entry drawer and closing itself. That is workflow: it decides what a delete means for two overlays and for the user.

Rule: same as F1 (*components orchestrate UI only*).

Suggested fix: `services/entries/deleteEntryFlow.js` with `deleteEntryWithFeedback(payload)` returning a result, or a `tableStore.confirmDeleteEntry` action that owns the side effects; the modal keeps the spinner state and calls one function. Effort: S–M.

### F3 — Restore application in the table page

`pages/PageTable.vue:209-258`

`restorePendingView` validates nothing itself — good — but it *applies* everything: hierarchy, active page, filters, branch scope, map seed, the page number, the reload and clearing the blob. `restoreFlow.js` already owns validation (`getPendingRestore`), so the two halves of one behaviour sit in different layers.

Rule: *"If code is entry … workflow logic, put it in `services/`"*; pages are *"route-level page components only"*.

Suggested fix: `services/entries/restoreFlow.js` gains `applyPendingRestore({ restoreParams, stores })` (or an injectable object), leaving the page with `if (await applyPendingRestore(...)) { return; }`. `PageMap.vue:182-196` already delegates its half to the store and can stay as is. Effort: S.

## Should fix

### F4 — The test rule contradicts every test in the repo

All **36** test files under `src/tests/` use `describe`/`it`/`expect`/`vi` from Vitest globals without `import { … } from 'vitest'` (the two new `drawerEntry.test.js` and `modalDeleteEntry.test.js` follow the repo convention). `CODE-STYLE.md → Testing` says imports must always be explicit.

This is a doc-versus-reality conflict, not a defect in one file. Two coherent options:

1. **Update the doc** (recommended): state that Vitest globals are enabled in `vite.config.js` and are the convention, keeping `vi.fn`/`vi.mock`, `NODE_ENV=test`, and `@/` imports as the rules. One-file change, no churn.
2. Add the import line to all 36 files. Mechanical, but it also means every future test must remember it.

### F5 — The style rules cannot be enforced today

`CODE-STYLE.md` says *"Always use the rules defined in the `eslint.config.js`"* and *"If you generate code that violates these, it will fail build"*. Reality in `vue-port/`:

- there is no `eslint.config.js` — only `.eslintrc.js` (eslintrc format, `parserOptions.parser: '@babel/eslint-parser'`);
- neither `eslint`, `eslint-plugin-vue` nor `@babel/eslint-parser` is in `package.json` or `node_modules`;
- there is no `lint` script (`dev`, `build`, `preview`, `test`, `test:watch` only);
- the `.eslintrc.js` test overrides target `**/__tests__/*` and `**/tests/unit/**/*.spec.{j,t}s?(x)` with `env: { jest: true }` — paths that do not exist here, so the real tests (`src/tests/**/*.test.js`, Vitest) would not match them.

So `semi`, `curly`, `quotes`, `comma-dangle` and the Vue option order are conventions held by review alone. The refactored code happens to satisfy them, but nothing prevents the next change from drifting.

Suggested fix: pick one and make it true — install the toolchain and add `"lint": "eslint src"` (plus flat config, and a Vitest-aware test override), **or** rewrite the `Linting` section to say the rules are review-enforced and there is no lint step. Effort: S (doc) / M (toolchain).

### F6 — Undocumented fourth export group: `...icons`

`CODE-STYLE.md` mandates exactly `{ state, ...methods, ...computedScope }`. Fourteen files return a fourth group: `DrawerEntry` (refactored, `:323-328`), `ModalDeleteEntry` (refactored), `ModalViewEntry`, `ModalMediaViewer`, `ToolbarTable`, `DrawerNavbarPrimary`, `DrawerWrapper`, `NavbarPrimary`, `DrawerDownload`, `DrawerUpload`, `Dropdown`, `PlayButton`, `PageTable`, `PageMap`.

This is the repo's established pattern, so it is the doc that is out of date. Suggested fix: add to `CODE-STYLE.md` that static icon/asset maps are returned as a trailing `...icons` object, never inside `state` or `computedScope`. Effort: S.

### F7 — Service/store reach-through across layers

- `stores/tableStore.js:361-392` — `deleteCurrentEntry` reloads the table and, when `navigationStore.activePage === 'map'`, calls `mapStore.loadLocations(...)`. A delete now decides what the map shows: workflow inside a store, plus a new table→map store dependency.
- `services/entries/dataEditorFlow.js` — `openEditEntry` picks its self link from `navigationStore.activePage` (`table` vs `map` links), and `getAddEntryAction` combines the permission check with the navbar label (including `helpers.textTruncate`) for a button.

Neither breaks a documented rule outright ("stores own shared state", "services own workflow"), but both put view decisions in a lower layer. Suggested fix: an entry-action service (`services/entries/entryActions.js`) that takes the active scope as input, and move the post-delete refreshes into the delete flow from F2. Effort: S each.

## Observations (not violations)

- **O1** `services/entries/entriesGridColumns.js` builds DOM nodes, opens modals and triggers navigation. AG Grid renderers must be plain DOM, and this is the port's existing pattern — but the file now carries three concerns (rendering, actions, payload shaping). Optional split: renderers in `core/entries/ag-grid/cellRenderers.js`, actions/payloads in the service. Effort: M.
- **O2** Dead import: `components/table/ToolbarTable.vue:87` imports `NavbarSecondary` and registers it at `:92`, but only `NavbarSecondaryLight` is used in the template. Pre-existing, outside this refactor. `no-unused-vars` is off, so nothing flags it.
- **O3** Debug logging: 20 `console.*` calls in `services/entries/entriesPageCache.js` (cache-key/size dumps) and 3 in `utils/localstorage.js`. `no-console` is configured `off`, so this ships. Consider gating on `env.isDev` or deleting the traces.
- **O4** Style-in-template literals: `PageTable.vue` binds `` :aria-label="`Add ${addEntryAction.label}`" `` and `` :title=… ``. Allowed by the port's own habit elsewhere (`NavbarPrimary`), but the label could be exposed from `computedScope` to keep the template declarative.
- **O5** Legacy-parity naming carried over: `PARAMETERS.CEll_TYPES` (capital `E`), `isPerformingLongAction`. Kept deliberately to mirror `app/config/parameters.js`; noted so a future reader does not "fix" it silently.
- **O6** `reactive({ projectStore, navigationStore, … })` — pages/components put store handles inside `state`. Consistent across the port and not a `ref()`/spread violation, but it does mean `state` is not purely "data". Worth one line in `CODE-STYLE.md` if the team wants it preserved.

## Priority

1. **F5** — decide whether the rules are enforced or aspirational; today the doc's "will fail build" is false.
2. **F1 / F2** — the two real component-layer violations, both also simplify the tests.
3. **F3** — finish the split that `restoreFlow.js` already started.
4. **F4 / F6** — doc decisions, cheap, and they remove false positives from future reviews.
5. **F7 / observations** — optional cleanup, no behaviour change.
