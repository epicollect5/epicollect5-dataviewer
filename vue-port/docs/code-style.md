# AI Rules — Vue Migration (Dataviewer)

These rules define the required coding style for the Vue refactor.

They mirror the Epicollect5 mobile app conventions.

If generic Vue guidance conflicts with this file, **this file wins**.

## Why This Style Exists

This codebase follows a strict, opinionated Vue style.

It is intentionally different from common public Vue examples.

The goal is **consistency, predictability, and maintainability at scale**.

---

### Architectural Principles

- Components are **UI orchestration only**
- Business logic lives in **services**
- State is centralized and structured
- Data flow is explicit and predictable

This separation avoids:
- duplicated logic
- hard-to-test components
- tightly coupled UI and business logic

---

### Vue Style Decisions

#### reactive() only

We use `reactive()` for all component state.

Reason:
- single mental model for state
- avoids mixing `ref()` and `reactive()`
- reduces cognitive overhead when reading code

---

#### Grouped structure (state, methods, computed)

Each component follows a consistent structure:

- `state` → data
- `methods` → actions
- `computed` → derived values

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

#### Services over component logic

All business logic must live in services.

Components:
- call services
- display results
- manage UI state only

Reason:
- reuse across the app
- easier testing
- clear separation of concerns

---

## Reference Implementation

See: `ExampleComponent.vue`

- This file is the **canonical pattern**.
- Always start from its structure.
- Prefer copying it over using generic Vue examples.

When generating Vue components:
- Start by copying `ExampleComponent.vue`.
- Then adapt it to the specific feature.

---

## Core Principles

- Follow existing mobile app architecture and conventions.
- Consistency is more important than “modern Vue best practices”.
- Do **NOT** introduce new patterns unless explicitly requested.

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

- Derived values must live in `computed: {}` (or equivalent grouped structure).
- Do **NOT** compute values inline in templates.
- Do **NOT** mix computed logic inside methods.

---

## Export Pattern

Always return a structured grouped API:

```javascript
return {
  ...state,
  ...methods,
  ...computed
};
```

- Do **NOT** return an unstructured mix of variables and functions.
- Keep the order consistent: `state` → `methods` → `computed`.

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
<button @click="methods.doSomething">
```

---

## Services & Architecture

- Business logic belongs in services.
- Components orchestrate; they do not implement logic.

```javascript
import entryService from '@/services/...';
```

- Always prefer calling a service over writing logic inside the component.

---

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
1. Follow `ExampleComponent.vue`
2. Follow this file
3. Then consider general Vue guidance
