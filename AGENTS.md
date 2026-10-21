# AGENTS.md

## Core Rules

- Do NOT introduce TypeScript
- Do NOT refactor unrelated code
- Do NOT introduce new patterns unless explicitly requested
- Follow existing architecture and conventions from `docs/`

## Two Codebases

This repository holds **two applications**. They have different stacks, different
architectures and different style rules. Never mix them.

### `app/` — legacy React application (frozen style)

React 15 + Redux 3, bundled by webpack 1. This code is **not being restyled**.
Work in it must keep its existing conventions:

- Imports are absolute from the `app/` root — `components/Loader`, `utils/helpers`,
  `config/parameters`. Never add `../` or `./` paths.
- `components/` are presentational, `containers/` are Redux-connected. The split
  leaks in places (a component may import `connect`) — do not "fix" it as a
  side effect of an unrelated change.
- Reducers are switched on `TYPE + '_PENDING' | '_FULFILLED' | '_REJECTED'`
  (redux-promise-middleware). Action type constants live in `app/config/actions.js`.
- Styling is SCSS compiled by gulp from `app/theme/app.scss`. No JS file imports
  a `.scss` file; the stylesheets are linked from `app/index.html`.
- Tests are Jest + Enzyme (`npm test`).

### `vue-port/` — Vue 3 port (new style applies)

Vue 3 + Pinia + Vite + Ionic Vue 8 + ag-grid-vue3. **This is where
`docs/CODE-STYLE.md` applies**, and nowhere else.

The port's source is currently on the `codex/datavuer` branch; `vue-port/` is
gitignored on `master`.

## Refactoring Rules

A behaviour-preserving refactor changes structure while preserving behaviour, contracts, and trust boundaries.

* Trust existing internal contracts. Tests, established calling patterns, store initialisations, and model invariants are evidence of intended data shapes.
* New guards, validation, fallbacks, catch blocks, or abstractions require a concrete justification — identify the specific boundary or demonstrated failure mode that requires them. The mere possibility that a value could be invalid is not sufficient.
* Unrelated hardening is outside the scope of a refactor.
* Prefer minimal diffs.

## Architecture Constraints

### Legacy app (`app/`)

- Components = presentational UI
- Containers = Redux-connected UI
- Actions = state transitions and requests
- Reducers = state slices
- Config = server URL, endpoints, action type constants
- Utils = pure helpers (parsing, dates, tables, map maths)

### Vue port (`vue-port/src/`)

- Components = UI only (no business logic)
- Stores = shared reactive state
- Services = business logic
- Core = domain logic (entry parsing, upload pairing, date formatting, map maths)
- Composables = reusable Vue composition logic

## Vue Rules

*(applies to `vue-port/**` only)*

- Use reactive(), NEVER ref()
- No inline logic in templates
- Group structure: state → methods → computedScope
- Always wrap `if`/`else`/`for`/`while` bodies in `{}`, even single statements
- Do NOT place workflow or business logic in components

## Testing

### Legacy app (`app/`, `__tests__/`)

- Use Jest + Enzyme (adapter `enzyme-adapter-react-15.4`)
- Run with `npm test`, or `npm test -- <path>` for a single file
- `setupTests.js` at the repo root configures the Enzyme adapter
- The whole suite is green — a failing test is a regression, not a known baseline

### Vue port (`vue-port/`)

- Use Vitest only
- Always import from 'vitest'
- Use vi.fn(), never jest.fn()
- Always prefix test runs with `NODE_ENV=test` (e.g. `NODE_ENV=test npx vitest run <file>`)
- The npm scripts already set it

## Import Paths

- Legacy app: absolute `app/`-rooted imports (`components/Loader`, `utils/helpers`);
  do not add relative paths (`../` or `./`)
- Vue port: always import via the `@` alias; `@/*` resolves to `vue-port/src/*`

## Search Tools

- For file search and content grep, use the fff MCP tools — `mcp__fff__find_files`
  (paths), `mcp__fff__grep` (content) and `mcp__fff__multi_grep` (several patterns
  at once). Include the known directory or module in the first search, use
  `definitions_only` for declarations, and read more source only when the
  returned lines need context.
- For symbol-level questions (call paths, architecture, "how does X work"), use
  codegraph — `mcp__codegraph__codegraph_explore`. One call returns the
  verbatim source grouped by file, plus the call path and blast radius.
- fff indexes the git-tracked tree, so the gitignored `vue-port/` is not in its
  index — use codegraph for the port's source.
- codegraph does not index configs, docs, stylesheets or build files — read those
  directly.

## Priority Rules

- `docs/CODE-STYLE.md` overrides generic Vue best practices (for `vue-port/**` only)
- Always follow existing patterns in the codebase over external examples

## System Risks Check (MANDATORY for new features)

Applies to: **new features, new data flows, new persistence/state, and new external integrations.**
Does **not** apply mechanically to behaviour-preserving refactors — see Refactoring Rules above.

For work in scope, do NOT assume correctness. Identify how the new behaviour can break.

You MUST:

* List ways data can become stale or inconsistent
* Check what happens when underlying data changes or is removed
* Consider failures: network, partial execution, concurrency
* Identify anything cached/stored and when it becomes invalid
* Consider side effects on other parts of the system

List at least three concrete risks specific to the new behaviour.
If none, justify why for each point.

Assume this runs at scale and causes inconsistencies after months in production.

## Git

Commit messages follow Conventional Commits:

- Format: `<type>(<scope>): <description>` — scope is optional for docs, test and chore commits
- Allowed types: feat, fix, refactor, perf, docs, test, build, ci, chore, style, revert
- Use imperative mood (e.g. "add", "fix", "remove")
- Do not capitalize the first word of the description
- Do not end the description with a period
- Maximum 75 characters total, including type and scope
- If the change includes both a fix and a feature, prefer the type that best reflects the primary purpose

## Source of Truth

- Architecture → docs/ARCHITECTURE.md
- Code style (Vue port) → docs/CODE-STYLE.md
- Commit and review rules → .github/commit-rules.md, .github/review-guidelines.md
- Custom agent commands → .agents/skills/*/SKILL.md (canonical; wrappers in .opencode/commands/)
