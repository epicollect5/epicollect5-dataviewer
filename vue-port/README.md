# Vue Port

Phase 1 scaffold for the Epicollect5 dataviewer migration.

## Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm test`

## Dev Server

The Vue port runs on `http://localhost:6789`.
The legacy React app keeps its existing port for side-by-side comparison.

Opening the root URL redirects to `/project/ec5-demo-project/data`, so the demo
project loads straight from the Vite dev server. Edit the slug in the path to
open any other project, for example `/project/my-project/data`.

The demo default and the root redirect are development-only conveniences. In
production the app is served at `/project/<project-slug>/data`, for example
`https://five.epicollect.net/project/ec5-demo-project/data`, and the project is
taken from the slug in that path.

When a URL has no slug, the app falls back to `VITE_PROJECT_SLUG` if it is set,
and otherwise shows the "Project Required" message. A slug in the path always
wins over the environment fallback.

## Environment

- `VITE_SERVER_URL`: backend base URL used by the Vite proxy and API client
- `VITE_DATA_EDITOR_BASE_URL`: add/edit entry base URL
- `VITE_PROJECT_SLUG`: optional fallback project slug for URLs without a slug in the path; the path slug always wins
- `VITE_MAPBOX_API_TOKEN`: reserved for later map work
- `VITE_ESRI_API_TOKEN`: reserved for later map work
- `VITE_ROLLBAR_ACCESS_TOKEN`: client token for error reporting. Reporting is off in development and in any build without the token, so it belongs in `.env.production` (`npm run build`) and in the deployment environment. The token is a public client token: it ships in the bundle by design, while `.env.*` files stay out of git. To check a deployed build, open any view with `?rollbar_test=1`: one report is sent, through the same path the app reports its own caught failures with. The flag does nothing in development.

## Scope

This workspace contains only the new Vue 3 implementation. The legacy app remains unchanged in the repository root.
