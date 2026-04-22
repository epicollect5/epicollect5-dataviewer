const env = {
  appName: import.meta.env.VITE_APP_NAME || 'Epicollect5 Dataviewer Vue Port',
  serverUrl: import.meta.env.VITE_SERVER_URL || 'https://five.epicollect.net',
  dataEditorBaseUrl: import.meta.env.VITE_DATA_EDITOR_BASE_URL || 'https://five.epicollect.net',
  projectSlug: import.meta.env.VITE_PROJECT_SLUG || '',
  mapboxApiToken: import.meta.env.VITE_MAPBOX_API_TOKEN || '',
  esriApiToken: import.meta.env.VITE_ESRI_API_TOKEN || ''
};

export default env;
