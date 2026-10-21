# QA Generation Workflow

Generate QA documentation from a codebase change or QA spec file.

## Inputs

- base_ref (default: master)
  Branch, tag, or commit SHA

- qa_spec_file (optional)
  docs/QA-{version}.md — `{version}` is this repo's release version (`X.Y.Z` from
  `CHANGELOG.md` and the git tags), e.g. `docs/QA-0.1.9.md`

## Diff scope

git diff {{base_ref}}..HEAD

## Reconciliation logic

If QA spec exists:

- Use it as reference documentation
- Compare against git diff results
- Ensure all new changes are covered in QA output

## Responsibilities

Identify all user-impacting changes across:

- Feature changes
- Reducer and action changes (`app/reducers/**`, `app/actions/**`, `app/config/actions.js`)
- Component and container changes (`app/components/**`, `app/containers/**`)
- Configuration changes (`app/config/parameters.js`), listing all new or modified `.env` variables
- Utility changes (`app/utils/**`) — entry parsing, upload pairing, date formatting, map maths
- Theme / SCSS changes (`app/theme/**`)
- Build and packaging changes (`webpack.config.js`, `gulpfile.js`, `package.json`)
- Vue port changes (`vue-port/**`) — the port ships the same features as the legacy app

## QA Generation Rules

For every meaningful change, generate at least one QA check.

Each QA check must include:

- **Test Description** — what is being tested.
- **Expected Result** — what success looks like.
- **Manual Action** — step-by-step staging instructions.

Rules:

- Must be executable in staging.
- No abstract descriptions.
- No unit/integration test instructions.
- Full coverage of changes required.
- No duplicates.
- The Baseline Regression Suite below is always emitted on top of the diff-derived checks; it is exempt from the "No duplicates" rule.

## Baseline Regression Suite (always included)

Every QA report MUST include the checks below, regardless of the diff. They are emitted even when the change does not touch layout, navigation, or data rendering, and they are **not** diff-derived.

Do not deduplicate them against diff-derived checks, and do not drop them when the diff is small or unrelated. They are the standing guard for this app's shared configuration surfaces — `app/config/parameters.js` (server URL, API endpoints, tile providers), `app/config/actions.js` (the action-type constants every reducer switches on), `app/reducers/index.js` (the `combineReducers` shape every `state.<slice>` access depends on) and `app/theme/_variables.scss` + `_mediaQueries.scss` (partials every other partial uses) — where a change to one surface silently breaks another. The same applies to the Vue port's equivalents under `vue-port/src/`.

### B1. Entries table loads, paginates and expands

- **Test Description:** Confirm the entries table loads a project, paginates, sorts and expands a row.
- **Expected Result:** The table renders the project's columns and rows; the fixed title/children/total/created-at columns stay in their configured positions; pagination advances and returns; sorting a column reorders the rows; expanding a row shows its detail without dropping the rest of the table.
- **Manual Action:** On staging, open a project with at least 30 entries; confirm the rows and the fixed column positions; page to the next page and back; sort by a data column; expand one row and collapse it; confirm no console errors and no blank columns.

### B2. Map renders tiles, markers, clusters and the heat layer

- **Test Description:** Confirm the map view loads its tiles, places markers, clusters them, and draws the heat layer.
- **Expected Result:** Satellite and street tiles load without a 401/403 from the tile provider; markers appear at the entry locations; markers cluster at low zoom and uncluster as you zoom in; the heat layer renders over the map; the attribution line is visible.
- **Manual Action:** On staging, open the map view for a project with geographic entries; confirm tiles paint (not a grey or blank grid); zoom in and out and confirm clusters split and merge; toggle the heat layer; confirm the attribution is present at the bottom.

### B3. Filter entries by form, status and date

- **Test Description:** Confirm the filter controls narrow the entry list and the map.
- **Expected Result:** Selecting a form filters the table and the map to that form's entries; the status filter behaves as selected; the date range filter accepts a from/to range and excludes entries outside it; clearing the filters restores the full list.
- **Manual Action:** On staging, open a project with entries across two forms and several dates; apply a form filter, then a date range, then clear both; confirm the table row count and the map markers change accordingly and return to the full set.

### B4. Bulk upload: preview, error placement and submit

- **Test Description:** Confirm a bulk upload template is parsed, its rows are previewed with errors placed on the right rows, and a valid upload succeeds.
- **Expected Result:** The chosen file is parsed into the preview table; each row shows its answers in the right column; invalid rows are flagged with the error on that row, not on another; the upload is blocked while errors remain; a clean file uploads and the entries appear in the table.
- **Manual Action:** On staging, upload a template with one deliberately invalid row and confirm the error lands on that row and the upload is refused; then upload a clean version and confirm it succeeds and the new entries appear.

### B5. Entry view, edit and delete

- **Test Description:** Confirm an entry can be opened, edited and deleted.
- **Expected Result:** Opening an entry shows its full answers and media; editing saves the change and the new value is shown; deleting removes the entry and the list updates without a stale row; the delete is a real deletion, not an archive.
- **Manual Action:** On staging, open an entry with media, edit one answer, save and confirm it persists after a reload; delete the entry and confirm it is gone from the table and from the map, and that a reload does not bring it back.

### B6. Download entries with export mapping

- **Test Description:** Confirm the download modal produces the mapped export.
- **Expected Result:** The download modal opens with the project's export mapping; the requested format (CSV/JSON) is honoured; the downloaded file contains the mapped fields and the expected number of entries; a project without a compatible export mapping fails with a clear message rather than an empty or corrupt file.
- **Manual Action:** On staging, open the download drawer, choose a format, start the download and confirm the file's contents and row count; repeat against a project with no valid export mapping and confirm the explanatory error.

### B7. Restore from a shared URL

- **Test Description:** Confirm a shared map link restores the previous map state.
- **Expected Result:** Opening a `?restore=` link restores the map filters, date range and pie-chart selection that were active when the link was created; the table shows the same filtered set; a link with an unknown or expired restore key falls back to the default view without an error.
- **Manual Action:** On staging, set a map filter and a date range, copy the share link, open it in a private window and confirm the same filters are applied; then tamper with the restore key and confirm the app loads the default view cleanly.

### B8. Theme and shared SCSS partials

- **Test Description:** Confirm the shared SCSS partials still resolve and the app is styled correctly.
- **Expected Result:** The app loads `dist/dataviewer.css` with no missing-variable or missing-mixin errors; the vendor stylesheet loads alongside it; the layout is not unstyled or broken; the responsive breakpoints still apply at the configured widths.
- **Manual Action:** On staging, load the app and confirm it is fully styled; resize through the configured breakpoints and confirm the layout reflows; check the browser console for stylesheet errors.

B1-B8 are emitted as CSV rows like any other check - apply the comma substitution rule to them too. Run the full suite in Chrome, Safari and Firefox: the map tile providers and the Leaflet layer order behave differently across engines, and the table's fixed-column layout is the most fragile surface in Firefox. Mark a cell `N/A` only when a check genuinely does not apply to that browser.

## Output Format

### 1. QA Report (Markdown file)

Grouped by feature or area.

### 2. QA CSV file (.csv)

Columns: `Action Description` | `Expected` | `Chrome` | `Safari` | `Firefox`

> The `|` above is markdown table/list notation for readability only — it is NOT the file separator. The `.csv` file must be a standard comma-separated file (commas delimit columns), so it imports cleanly into Google Sheets.

- One row per QA check.
- Action must describe a human action in staging.
- Expected must describe observable result.
- The browser columns (`Chrome`, `Safari`, `Firefox`) are filled in during the QA process to record the outcome per browser (e.g. PASS/FAIL or any browser-specific notes).
- All three browsers are targeted. Where a check genuinely does not apply to one of them, pre-fill that cell with `N/A` at generation time.
- If a check is not applicable on a given browser, record that explicitly (e.g. N/A) instead of leaving it blank.
- Commas are used only as column separators, never inside cell text.
- Inside `Action Description` and `Expected`, replace commas with `;` to separate step lists or clauses, so they never collide with the comma column separator and the CSV imports cleanly into Google Sheets (the `|` in this doc's column list above is just markdown notation, not a separator in the file).
- Cell text must stay comma-free; no quoted/escaped fields are needed.

## Validation Rules

Before output, ensure:

- Full coverage of changes.
- No duplicates.
- All steps reproducible in staging.
- Diff fully mapped to QA checks, plus the Baseline Regression Suite.
- The Baseline Regression Suite is present in both the Markdown report and the CSV.
- No commas inside CSV cell text; commas only separate columns.
