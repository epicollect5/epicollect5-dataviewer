# AI Rules — Epicollect5 Dataviewer (Vue port)

These rules define the required coding style for the **Vue port only**.

> **Scope: `vue-port/**`.**
> The legacy React application under `app/**` keeps its existing conventions and is
> **not** restyled. Nothing in this file applies to `app/**` or `__tests__/`.

If generic Vue guidance conflicts with this file, **this file wins** — but only for
`vue-port/**`.

## Why This Style Exists

This codebase follows a strict, opinionated Vue style.

It is intentionally different from common public Vue examples.

The goal is **consistency, predictability, and maintainability at scale**.

---

## Architecture

- Components orchestrate UI only
- Stores own shared reactive state
- Composables contain reusable Vue composition logic
- Core contains dataviewer-specific helper and transformation logic
- Services contain API and workflow-facing code
- Do not put business logic directly in components

### Vue Style Decisions

#### reactive() only

We use `reactive()` for all component states.

Reason:
- single mental model for state
- avoids mixing `ref()` and `reactive()`
- reduces cognitive overhead when reading code

---

#### Grouped structure (state, methods, computed)

Each component follows a consistent structure:

- `state` → data
- `methods` → actions
- `computedScope` → derived values (computed)

Reason:
- predictable layout across all components
- easier navigation and onboarding
- avoids scattered logic

---

#### No inline template logic

Templates must not contain inline functions or complex expressions.

Reason:
- keeps templates declarative and readable
- ensures logic stays in methods/services
- improves debuggability

---

## Services & Architecture

- Business logic does not belong directly in components.
- Components orchestrate UI; they do not implement workflow logic.
- Put code in the correct architectural layer.

Use the structure rules:

- `src/stores/`
  Shared reactive state and model-like app state

- `src/core/`
  Domain logic: entry parsing, upload row pairing, date formatting, map maths

- `src/composables/`
  Reusable Vue composition logic only

- `src/components/`
  Reusable UI components only

- `src/pages/`
  Route-level page components only

### Rules

- If code is about backend requests, put it in `services/`
- If code is shared state, put it in `stores/`
- If code is dataviewer-specific transformation logic, put it in `core/`
- If code is reusable Vue composition logic, put it in `composable/`
- If code is entry or upload workflow logic, put it in `services/`
- Do not put workflow or business logic directly in components

## Reference Implementation

See: `src/components/`

- This folder is the **canonical pattern**.
- Always start from the structure of the components already committed there.
- Prefer copying them over using generic Vue examples.

When generating Vue components:
- Start by copying an existing component from `src/components/`.
- Then adapt it to the specific feature.

---

## Core Principles

- Follow existing dataviewer port architecture and conventions.
- Consistency is more important than “modern Vue best practices”.
- Do **NOT** introduce new patterns unless explicitly requested.

---

## Linting

- Always use the rules defined in the `eslint.config.js` file of the port

---

## State

- Use `reactive()`, **NOT** `ref()`.
- `ref()` is not part of this codebase style. Do not generate code using ref() under any circumstance unless explicitly requested.
- Keep state grouped in a single object.
- Do not apply generic Composition API best practices. Follow this repository’s conventions exactly.

```javascript
const state = reactive({
  ...
});
```

- Do **not** create scattered standalone variables.
- Do **not** mix `reactive` and `ref` arbitrarily.

---

## Methods

- All template callbacks must be defined in `methods: {}`.

```javascript
const methods = {
  ...
};
```

- Do **NOT** use inline functions in templates.
- Do **NOT** place business logic directly in components when it belongs in services.

---

## Computed

- Derived values must live in `computedScope: {}` (or equivalent grouped structure).
- Do **NOT** compute values inline in templates.
- Do **NOT** mix computed logic inside methods.

---

## Export Pattern

Always return a structured grouped API:

```javascript
return {
  state,
  ...methods,
  ...computedScope
};
```

- Do **NOT** return an unstructured mix of variables and functions.
- Keep the order consistent: `state` → `methods` → `computedScope`.
- Important: NEVER spread `state`

---

## Template Rules

- No inline logic.
- No inline arrow functions.

❌ **Avoid:**
```html
<button @click="() => doSomething()">
```

✅ **Use:**
```html
<button @click="doSomething()">
```

---

## Theme

- Always put component styles in separate scss named after the component.
- Reference the style in the component like `<style src="@/theme/media/Component.scss" lang="scss"></style>`
- theme folder structure mirrors component folder structure 1:1

## Anti-Patterns (STRICT)

Do **NOT**:
- Use `ref()` unless absolutely necessary.
- Introduce React-style patterns (hooks, local state everywhere, etc.).
- Create composables as a replacement for services.
- Move logic into components that belongs in services.
- Introduce TypeScript.
- Rewrite architecture to “modern Vue” patterns.

---

## Mental Model

- **State** = data container
- **Methods** = actions
- **Computed** = derived state
- **Services** = business logic
- **Components** = UI orchestration only

---

## Priority Order

When in doubt:
1. Follow the components already in `src/components/`
2. Follow this file
3. Then consider general Vue guidance

---

# ESLint & Style Rules

You must follow these rules strictly. If you generate code that violates these, it will fail build.

- **Semicolons**: ALWAYS use semicolons at the end of statements (`'semi': ['error', 'always']`).
- **Braces**: ALWAYS wrap `if`/`else`/`for`/`while` bodies in `{}`, even single statements (`'curly': ['error', 'all']`).
- **Quotes**: Use SINGLE quotes for strings (`'quotes': ['error', 'single']`).
- **Commas**: NEVER use trailing commas (`'comma-dangle': [1, 'never']`).
- **Variables**: Prefer `const` over `let`, and NEVER use `var`.
- **Vue Components**:
  - Disable multi-word component name checks.
  - Follow this specific order for component options: props, emits, setup, data, computed, watch, methods.
- **Environment**: This is a Vue 3 + Pinia + Vite project with Ionic Vue 8 and ag-grid-vue3.

---

# Testing Requirements

*(applies to `vue-port/**` only — the legacy app under `app/**` uses Jest + Enzyme)*

- **Framework**: Use Vitest for all tests in the port. Never use Jest there.
- **Imports**: Always import testing functions from 'vitest' (e.g., `import { describe, it, expect, vi } from 'vitest';`).
- **Mocks**: Use `vi.fn()` or `vi.spyOn()` instead of `jest.fn()` or `jest.spyOn()`.
- **Globals**: Even if globals are enabled in `vite.config.js`, explicitly include imports in generated snippets to ensure type safety.
- **Command**: Run with `NODE_ENV=test npx vitest run <file>` — without it, tests fail with misleading environment errors.
