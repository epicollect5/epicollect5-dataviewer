import client from '@/services/api/client';
import PARAMETERS from '@/core/config/parameters';

export const downloadEntries = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_DOWNLOAD_ENDPOINT}${projectSlug}`, { params });
};
