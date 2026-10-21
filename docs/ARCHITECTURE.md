# Epicollect5 Dataviewer — Architecture

Source of truth for the system's design. Read it before changing anything;
cross-check any candidate finding against it.

This repository holds **two applications**. They are independent: different
stacks, different architectures, different style rules. Never mix them.

| | Legacy app | Vue port |
|---|---|---|
| Path | `app/` | `vue-port/` |
| Stack | React 15, Redux 3, webpack 1, gulp | Vue 3, Pinia 3, Vite 6 |
| UI kit | react-bootstrap 0.33, Bootstrap 3 CSS | Ionic Vue 8, ag-grid-vue3 |
| Map | Leaflet | Leaflet + markercluster + heat |
| Tests | Jest 22 + Enzyme | Vitest 3 + @vue/test-utils |
| Style rules | frozen, see `AGENTS.md` | `docs/CODE-STYLE.md` |
| Status | in production | in progress — source lives on branch `codex/datavuer` |

---

# Part 1 — Legacy React app (`app/`)

73 JS files. Bundled by webpack 1 into `dist/dataviewer.js`, styled by gulp into
`dist/dataviewer.css`.

## Entry point and store

`app/app.js` is the only entry.

```js
createStoreWithMiddleware = applyMiddleware(promiseMiddleware(), thunk, logger())(createStore)
```

`redux-logger` is added only when `NODE_ENV !== 'production'`.

The store is created with `combineReducers` from `app/reducers/index.js`:

```js
const rootReducer = combineReducers({
    drawerReducer, filterEntriesReducer, projectReducer, navigationReducer,
    tableReducer, mapReducer, modalReducer, toastReducer
});
```

The **state key is the reducer name**, not the file name — `state.mapReducer`,
`state.tableReducer`, and so on. Adding, removing or renaming a slice is a
breaking change for every `state.<slice>` access across the app.

## Rendering

`ReactDOM.render` mounts `<Main />` onto `#app` (declared in `app/index.html`),
wrapped in `<Provider>`.

## No router

There is no routing library. The URL is parsed by hand in
`app/containers/Main.js`:

```js
//get the project slug from url, always in the form {path}/{project_slug}/data
const projectSlug = parts[parts.length - 2];
```

The same function derives `PARAMETERS.DATA_EDITOR_BASE_PATH` and
`PARAMETERS.SERVER_URL` by stripping path segments off `window.location.href`.
`PARAMETERS` is a **mutable module-level object** — it is rewritten at runtime
before the first fetch.

When running against a local server (`PARAMETERS.IS_LOCALHOST === 1`),
`PARAMETERS.SERVER_URL` is replaced with `process.env.REACT_APP_SERVER_URL`.

Page switching is a Redux flag, not a route change: `navigationReducer.activePage`
is compared against `PARAMETERS.PAGE_TABLE` / `PAGE_MAP` / `PAGE_HOME`.

**Both the table and the map stay mounted.** `Main.render()` toggles a CSS class
(`''` vs `'hidden'` / `'shifted'`) instead of unmounting, so the Leaflet map and
the grid do not lose their state on every switch.

## Data layer

- HTTP: `axios`, with `X-XSRF-TOKEN` and `Content-Type: application/vnd.api+json`
  set as default headers in `app/containers/Main.js`.
- `redux-promise-middleware` gives every reducer three cases:
  `TYPE + '_PENDING' | '_FULFILLED' | '_REJECTED'`. A reducer that handles only
  `TYPE` never fires.
- `redux-thunk` is available for multi-step dispatches.
- Action types: `app/config/actions.js` — `SCREAMING_SNAKE_CASE` constants, each
  string equal to its own name.
- Action creators: `app/actions/index.js` (single file, ~819 lines).

## Restore from a shared URL

`?restore=<key>` in the URL makes `app/app.js` read the previous map state from
`localstorage.getRestoreParams()` (`app/utils/localstorage.js`) and **pre-seed
the whole `mapReducer` slice** as the store's initial state, overriding the
reducer's own `initialState`.

The pre-seeded object lists every key of `mapReducer` explicitly. Adding a field
to `mapReducer` without adding it to this literal means restored links silently
lose that field.

## Configuration

`app/config/parameters.js` holds one mutable `PARAMETERS` object:

- `SERVER_URL`, `DATA_EDITOR_BASE_PATH` — rewritten at runtime from the URL
- `API_*_ENDPOINT` constants — every backend endpoint the app talks to
- `PAGE_*`, `DRAWER_*` — the string constants compared against reducer state
- `TABLE_*` — fixed column indexes and table limits
- Tile providers, built from the env vars `REACT_APP_ESRI_API_TOKEN` and
  `REACT_APP_CARTO_API_KEY`

`.env` is injected at build time by webpack's `Dotenv` plugin. It holds
`REACT_APP_ESRI_API_TOKEN`, `REACT_APP_CARTO_API_KEY` and `REACT_APP_SERVER_URL`.
A missing env var does not fail the build — it ships a **broken map** (tiles
without a token/key). `.env` is gitignored.

## Imports

`webpack.config.js` sets:

```js
resolve: { modulesDirectories: ['app', 'node_modules'] }
```

That is what makes `import Loader from 'components/Loader'` resolve. **No
relative paths** (`../`, `./`) are used in `app/`. The same trick is configured
for Jest via `moduleDirectories` in `package.json`.

## Styling

SCSS, compiled by gulp — **no JS file imports a `.scss` file**.

- `app/theme/app.scss` uses Sass `@use` to pull in partials
  (`_variables`, `_mixins`, `_mediaQueries`, and one partial per component area)
  → `dist/dataviewer.css`
- `app/vendor/css/dataviewer/*.css` are concatenated → `dist/vendor-dataviewer.css`
- Both stylesheets are `<link>`ed from `app/index.html`

The shared partials `_variables.scss` and `_mediaQueries.scss` are used by every
other partial. A change to either silently changes every component.

## Utils

`app/utils/` holds pure helpers, one concern per file:

| File | Concern |
|---|---|
| `entry-parser.js` / `reverse-entry-parser.js` | entry ⇄ table-row mapping |
| `bulk-upload.js` | upload template parsing, row pairing, error placement |
| `datetime.js` | date formatting and comparison |
| `table.js` | headers, columns, fixed-column indexes |
| `mapUtils.js` | Leaflet maths: bounds, clusters, heat points |
| `localstorage.js` | the restore-params round trip |
| `requests.js` | shared request helpers |
| `helpers.js` | generic helpers (incl. `getParameterByName`) |
| `pie-chart.js` | distribution chart data |
| `entry-group-parser.js` | group/branch question structure |

## Tests

`__tests__/` at the repo root, mirroring the `app/` layout. Jest 22 + Enzyme 3
with the `enzyme-adapter-react-15.4` adapter, configured in `setupTests.js`.

```bash
npm test                        # jest --silent
npm test -- __tests__/utils/helpers.test.js
```

> The whole suite is green. A failing test is a regression — there is no
> known-broken baseline to exclude.

---

# Part 2 — Vue port (`vue-port/`)

A Vue 3 rewrite of the same product. **Not yet merged into `master`.**

## Status

- The port's source is committed on the **`codex/datavuer`** branch (47 commits).
- `vue-port/` is **gitignored** on `master`; `vue-port/src/` on disk is an empty
  skeleton.
- `vue-port/node_modules` and `vue-port/dist` are pre-populated and match the
  intended dependency set, so the scaffold can be restored without a reinstall.

## Stack

| Concern | Choice |
|---|---|
| Framework | Vue 3.5 (`<script setup>`) |
| Build | Vite 6 |
| State | Pinia 3 |
| Routing | vue-router 4 |
| UI | Ionic Vue 8, ag-grid-vue3 |
| Map | leaflet, leaflet.markercluster, leaflet.heat |
| Data | axios, fecha, moment, papaparse |
| Cache | lscache, lz-string |
| Tests | Vitest 3, @vue/test-utils 2, jsdom |

## Layout

```
vue-port/src/
  components/    reusable UI components (incl. components/global/)
  pages/         route-level components, named Page*
  stores/        Pinia stores
  core/          domain logic: entries, upload, datetime, map
  services/      API and workflow-facing code
  composables/   reusable Vue composition logic
  theme/         theme mirrors the component folder 1:1
  schemas/       project/entry JSON schemas
  tests/
    unit/        core, domain, stores, utils
    integration/ *.smoke.test.js
```

## Routing

Route components are `Page*`-prefixed (`PageData`, `PageNotFound`) and lazily
loaded.

## Stores

`mapStore`, `tableStore`, `uploadStore`, `projectStore` — the Pinia equivalents
of the legacy `mapReducer`, `tableReducer`, upload state and `projectReducer`.

## Environment

`vue-port/.env.development` and `vue-port/.env.production` use the `VITE_` prefix:
`VITE_SERVER_URL`, `VITE_DATA_EDITOR_BASE_URL`, `VITE_PROJECT_SLUG`,
`VITE_ESRI_API_TOKEN`.

## Tests

```bash
cd vue-port
NODE_ENV=test npx vitest run <file>
```

`NODE_ENV=test` is load-bearing — without it the shell's `NODE_ENV` can make
Vite externalize Node builtins to empty browser stubs and fail every spec
importing them, even when the suite is green.

## Style

`docs/CODE-STYLE.md` — **Vue port only**. The legacy app is not restyled.

---

# Build, release and deploy

## Legacy app

```bash
npm run build      # gulp css && webpack -p --progress
npm run deploy     # build + ./copy-to-server.sh
npm start          # webpack-dev-server (port 2222) & gulp watch
npm test           # jest --silent
```

`npm run build` produces the two deployable artifacts:

- `dist/dataviewer.js`
- `dist/dataviewer.css`

`copy-to-server.sh` copies them into the EpiCollect5 server's public directory
(`epicollect5-server/public/dataviewer/{js,css}`). `copy-to-server-example.sh`
is the committed template.

## Versions

The release version is plain semver `X.Y.Z`:

- `CHANGELOG.md` → `# Release Notes`, then one `## X.Y.Z` heading per release
- git tags are `X.Y.Z` (latest `0.1.8`)

> **`package.json` and `package-lock.json` currently say `1.0.0`, which has
> drifted from the tag/CHANGELOG (`0.1.8`).** The git tag and the CHANGELOG
> heading are the authoritative version. `package.json` is not.

## Vue port

`vue-port/dist/` is the Vite build output. It is **not** the legacy `dist/` —
do not mix them up when attaching release assets.
