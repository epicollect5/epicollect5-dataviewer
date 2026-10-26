//the Vite dev link opens the root url: redirect it to the public demo project
//with the slug in the path, so the address can be edited to open any project
const devProjectSlug = import.meta.env.DEV ? 'ec5-demo-project' : '';

const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Epicollect5 Dataviewer Vue Port',
  serverUrl: import.meta.env.VITE_SERVER_URL || 'https://five.epicollect.net',
  dataEditorBaseUrl: import.meta.env.VITE_DATA_EDITOR_BASE_URL || 'https://five.epicollect.net',
  projectSlug: import.meta.env.VITE_PROJECT_SLUG || '',
  defaultProjectSlug: import.meta.env.VITE_PROJECT_SLUG || devProjectSlug,
  //legacy parity for PARAMETERS.IS_LOCALHOST: while debugging, entry actions are
  //enabled even when the project user is not logged in (public demo projects)
  isDev: import.meta.env.DEV,
  //empty in development and in any build that did not get the token: error
  //reporting stays off rather than failing the build
  rollbarAccessToken: import.meta.env.VITE_ROLLBAR_ACCESS_TOKEN || '',
  mapboxApiToken: import.meta.env.VITE_MAPBOX_API_TOKEN || '',
  esriApiToken: import.meta.env.VITE_ESRI_API_TOKEN || ''
};

export default env;
