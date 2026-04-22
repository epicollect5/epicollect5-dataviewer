import PARAMETERS from '@/core/config/parameters';

const buildUrl = (path) => new URL(path, PARAMETERS.SERVER_URL).toString();

const apiConfig = {
  baseUrl: PARAMETERS.SERVER_URL,
  project: buildUrl(PARAMETERS.API_PROJECT_ENDPOINT),
  entries: buildUrl(PARAMETERS.API_ENTRIES_ENDPOINT),
  entriesLocations: buildUrl(PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT),
  media: buildUrl(PARAMETERS.API_MEDIA_ENDPOINT),
  uploadHeaders: buildUrl(PARAMETERS.API_UPLOAD_HEADERS_ENDPOINT),
  bulkUpload: buildUrl(PARAMETERS.API_BULK_UPLOAD_INTERNAL_ENDPOINT),
  uploadTemplate: buildUrl(PARAMETERS.API_UPLOAD_TEMPLATE_ENDPOINT),
  deleteEntry: buildUrl(PARAMETERS.API_DELETION_ENDPOINT)
};

export default apiConfig;
