# Vue Port Structure Rules

This file defines the folder and naming rules for the Vue rewrite in `vue-port/`.

## Goals

- Keep the rewrite isolated from the legacy app.
- Keep file placement predictable.
- Separate UI, state, API, and core business logic.
- Avoid recreating a `features/` or `utils/` junk drawer.

## Top-Level `src/` Structure

- `src/components/`
  All Vue UI components.

- `src/composable/`
  Reusable Vue composables only.

- `src/core/`
  Dataviewer-specific helper logic and transformations.

- `src/pages/`
  Route-level page components.

- `src/router/`
  Vue Router setup.

- `src/services/`
  Workflow-facing and request-facing code.

    - `src/services/api/`
      Backend clients and endpoint-specific request functions.

    - `src/services/upload/`
      Upload-specific workflow logic.

    - `src/services/entries/`
      Entry-specific workflow logic.

- `src/stores/`
  Pinia stores and shared reactive app state.

- `src/tests/`
  Unit and integration tests.

- `src/theme/`
  Global styles, theme tokens, and shared visual rules.

- `src/utils/`
  Truly generic helpers only.

## Component Placement

All Vue components belong under `src/components/`.

Current component groups:

- `src/components/app/`
- `src/components/entry/`
- `src/components/forms/`
- `src/components/global/`
- `src/components/map/`
- `src/components/media/`
- `src/components/table/`
- `src/components/upload/`

Create a new subfolder only when the component group is real and reusable, not for one-off organization.

## Naming Rules

Component type goes first in the filename.

Examples:

- `AppShell.vue`
- `AppHeader.vue`
- `DrawerAppHost.vue`
- `DrawerEntry.vue`
- `ModalDeleteEntry.vue`
- `ModalMediaViewer.vue`
- `ModalUpload.vue`
- `OverlayWait.vue`
- `PageMap.vue`
- `PageTable.vue`
- `ToolbarTable.vue`
- `GridEntries.vue`

Use these prefixes consistently:

- `App*`
  App shell and app-level hosts.

- `Page*`
  Route-level pages.

- `Modal*`
  Modal content components.

- `Drawer*`
  Drawer content or drawer hosts.

- `Toast*`
  Toast hosts or toast-specific components.

- `Overlay*`
  Full-screen overlays.

- `Grid*`
  Grid/table wrapper components.

- `Toolbar*`
  Toolbar components.

- `State*`
  Empty/loading/error state components.

## Pages

Route components live in `src/pages/`.

Rules:

- Use `Page*` naming.
- Pages compose stores, API flows, and UI components.
- Pages should stay thin where possible.
- Heavy UI should move into `src/components/`.

## Composables

Reusable composables live in `src/composable/`.

Rules:

- Use `use*` naming.
- Put Vue reactivity and lifecycle orchestration here.
- Do not place plain business logic here.
- Do not place API wrappers here unless the composable is explicitly coordinating a UI flow.

Examples:

- `useLeafletMap.js`
- `useUploadGrid.js`
- `useEntriesGrid.js`

## Core vs. Utils

Use `src/core/` for dataviewer-specific helpers and transformations.

Examples:

- entry parsing
- upload row pairing
- upload error placement
- map data shaping
- datetime formatting tied to app behavior

Use `src/utils/` only for generic helpers that are not specific to dataviewer rules.

If a file encodes Epicollect or dataviewer-specific behavior, it belongs in `core`, not `utils`.
## Services

`src/services/` contains workflow-facing and request-facing code.

Rules:

- use `services/api/` for backend communication and endpoint-specific request functions
- use `services/upload/` for upload-specific workflow logic
- use `services/entries/` for entry-related workflow logic
- do not mix UI rendering logic into services

## Stores

`src/stores/` contains Pinia stores.

Rules:

- stores own shared app state
- stores act as the model layer for the app
- stores may coordinate with `services/` and `core/`
- stores should not contain DOM logic or large view-specific logic

## Theme

Global styling belongs in `src/theme/`.

Rules:

- theme tokens in `variables.css`
- global app styling in `main.scss`
- do not recreate `src/styles/`
- prefer extending the central theme files over scattering global CSS across components

## Tests

Tests stay under `src/tests/`.
Use vitest, not jest

Rules:

- keep unit tests close to the architectural area they validate
- `unit/core/` for core logic
- `unit/stores/` for Pinia
- `integration/` for page and workflow smoke coverage

## Placement Checklist

When adding a file, ask:

1. Is it route-level UI?
   Put it in `src/pages/`.

2. Is it a reusable Vue component?
   Put it in `src/components/`.

3. Is it a reusable Vue composable?
   Put it in `src/composable/`.

4. Is it product-specific business logic?
   Put it in `src/core/`.

5. Is it a generic helper?
   Put it in `src/utils/`.

6. Is it backend communication?
   Put it in `src/services/api/`.

7. Is it entry or upload workflow code?
   Put it in `src/services/entries/` or `src/services/upload/`.

8. Is it shared styling or tokens?
   Put it in `src/theme/`. 

## Avoid

- Do not reintroduce `src/api/`.
- Do not reintroduce `src/features/`.
- Do not reintroduce `src/views/`.
- Do not reintroduce `src/styles/`.
- Do not create vague buckets like `misc`, `helpers`, or `common` for UI components.
- Do not put business logic into components if it can live in `core`.
- Do not put generic helpers into `core`.
