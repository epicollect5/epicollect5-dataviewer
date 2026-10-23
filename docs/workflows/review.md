# Code Review Workflow

This is a review-only task.

## Inputs

- **git diff** against base branch (primary source of truth).
- **Full file context** when needed to understand surrounding code.
- **Code comments** — read the comments in every changed file before raising any candidate finding. Comments may state invariants or design decisions (e.g., why the table and the map both stay mounted) that the diff alone cannot show. Do not raise a finding that a comment in the changed code explicitly addresses.
- **`docs/ARCHITECTURE.md`** — read the whole file before raising any candidate finding. It is the source of truth for system design. Cross-check any candidate against the whole document before raising it; if it matches, drop it.
- **`docs/known-review-false-positives.md`** — read the whole file before raising any candidate finding. It lists findings that look like defects but are by design. If a candidate matches an entry (or is the same defect on a different path), drop it. Read the architecture document too: an entry may reference the section where the design is explained.

## Responsibilities

- Analyze only changed code.
- Determine the base branch automatically (`master`, `main`, `dev`, or upstream tracking branch).
- Determine what the change is intended to do.
- Detect regressions or unintended behavior changes.
- Assume the author intentionally implemented the feature.
- Prioritize correctness over style.

## Review Mode

- Do not modify files.
- Do not propose large refactors.
- Do not enter planning mode.
- Do not generate implementation steps unless necessary to explain a bug.

## Focus Areas

Review changes for:

- **Business logic correctness**: unintended side effects from logic modifications.
- **State and reducer shape**: a change to `app/reducers/index.js` renames or removes a slice that `state.<slice>` accesses depend on; a reducer stops handling the `_PENDING` / `_FULFILLED` / `_REJECTED` cases that `redux-promise-middleware` dispatches; an action-type constant in `app/config/actions.js` is renamed or reused for a different payload.
- **Restore-from-URL**: `app/app.js` pre-seeds the whole `mapReducer` slice from `localstorage.getRestoreParams()`. A new field added to `mapReducer` but not to that literal is silently lost on a restored link.
- **Config and environment**: `app/config/parameters.js` holds the server URL, the `API_*` endpoints and the tile providers. A missing `.env` variable (`REACT_APP_ESRI_API_TOKEN`, `REACT_APP_CARTO_API_KEY`) does not fail the build — it ships a broken map. `PARAMETERS` is mutated at runtime from the URL, so a change to the URL-parsing in `app/containers/Main.js` moves the server base path for every request.
- **Build and packaging**: the webpack `resolve.modulesDirectories: ['app', 'node_modules']` contract is what makes `components/Loader`-style imports resolve; the SCSS partial order in `app/theme/app.scss`; the shared `_variables.scss` and `_mediaQueries.scss` partials, which every other partial uses.
- **API compatibility**: breaking changes to the backend contract the `API_*` endpoints encode.
- **Security vulnerabilities**: injection risks, missing authorization checks, exposed secrets or API tokens.
- **Missing edge cases**: unvalidated input at trust boundaries (user input, network/API responses, or persisted data whose schema cannot be assumed), missing checks on genuinely optional values, unchecked error paths from external calls.
- **Performance issues**: unnecessary requests, missing caching, inefficient algorithms — in particular map clustering and table pagination limits (`PARAMETERS.MAX_ENTRIES_FOR_UNCLUSTERING`, `TABLE_UPLOAD_PER_PAGE`).
- **Missing tests**: features or fixes that should have corresponding automated tests.

## Vue port parity

When the change touches `vue-port/`, also check:

- The port and the legacy app under `app/` must not drift on the same behaviour — entry parsing, upload row pairing, date formatting and map maths are ported from `app/utils/` and must stay equivalent.
- `docs/CODE-STYLE.md` applies to `vue-port/**` only. Never report the legacy app for not following it.
- The port's own test suite is Vitest (`NODE_ENV=test npx vitest run <file>`); the legacy suite is Jest (`npm test -- <file>`). Do not suggest running one against the other.

## Explicitly Ignore

Do NOT comment on:

- Formatting or whitespace.
- Naming conventions.
- Style-only feedback.
- Unrelated refactoring suggestions.
- The legacy app's age or style — it is frozen and is not being restyled.
- Defensive validation added during a refactor where the original code already trusted the contract and no concrete boundary or failure mode is identified.

## Output Format

### Per-Issue Format

For every finding:

- **Number**: Each finding MUST be numbered sequentially starting at 1 (1, 2, 3, ...), in report order. Numbers must be unique, never skipped or reused, and are the identifier used to reference the finding anywhere else in the review (e.g., "see #3").
- **Severity**: Critical | High | Medium | Low
- **File**: `path/to/file.js:line`
- **Explanation**: What is wrong and why it matters.
- **Suggested fix**: Concrete code change or approach.

### Final Sections

After the individual findings, include:

#### Overall Risk Score

Rate the changeset 1-10 (1 = trivial/safe, 10 = high risk of breakage). Justify briefly.

#### Suggested Manual QA Areas

List specific user flows or scenarios to manually test in staging, tied to the changed code.

#### Missing Tests

List test files and cases that should be written to cover the changed logic — Jest under `__tests__/` for the legacy app, Vitest under `vue-port/src/tests/` for the port.

#### Uncertainties

Explain where the review may lack context (e.g., unknown business rules, external dependencies, unclear requirements).
