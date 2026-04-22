import client from '@/services/api/client';
import PARAMETERS from '@/core/config/parameters';

export const fetchUploadHeaders = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_UPLOAD_HEADERS_ENDPOINT}${projectSlug}`, { params });
};

export const bulkUploadEntries = (projectSlug, payload) => {
  return client.post(`${PARAMETERS.API_BULK_UPLOAD_INTERNAL_ENDPOINT}${projectSlug}`, payload);
};

export const uploadEntryWithResult = async (projectSlug, payload) => {
  try {
    const response = await bulkUploadEntries(projectSlug, payload);
    return {
      status: 'success',
      payload: response.data
    };
  } catch (error) {
    return {
      status: 'error',
      payload: error.response?.data || {
        errors: [{ title: error.message }]
      },
      errors: error.response?.data?.errors || [{ title: error.message }]
    };
  }
};
