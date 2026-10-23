//the Vite dev link opens the root url: redirect it to the public demo project
//with the slug in the path, so the address can be edited to open any project
const devProjectSlug = import.meta.env.DEV ? 'ec5-demo-project' : '';

const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Epicollect5 Dataviewer Vue Port',
  serverUrl: import.meta.env.VITE_SERVER_URL || 'https://five.epicollect.net',
  dataEditorBaseUrl: import.meta.env.VITE_DATA_EDITOR_BASE_URL || 'https://five.epicollect.net',
  projectSlug: import.meta.env.VITE_PROJECT_SLUG || '',
  defaultProjectSlug: import.meta.env.VITE_PROJECT_SLUG || devProjectSlug,
  mapboxApiToken: import.meta.env.VITE_MAPBOX_API_TOKEN || '',
  esriApiToken: import.meta.env.VITE_ESRI_API_TOKEN || ''
};

export default env;
