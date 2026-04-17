# Vue Port

Phase 1 scaffold for the Epicollect5 dataviewer migration.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

## Dev Server

The Vue port runs on `http://localhost:5174`.
The legacy React app keeps its existing port for side-by-side comparison.

## Environment

- `VITE_SERVER_URL`: backend base URL used by the Vite proxy and API client
- `VITE_DATA_EDITOR_BASE_URL`: add/edit entry base URL
- `VITE_MAPBOX_API_TOKEN`: reserved for later map work
- `VITE_ESRI_API_TOKEN`: reserved for later map work

## Scope

This workspace contains only the new Vue 3 implementation. The legacy app remains unchanged in the repository root.
