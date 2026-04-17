import client from '@/api/client';
import PARAMETERS from '@/config/parameters';

export const downloadEntries = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_DOWNLOAD_ENDPOINT}${projectSlug}`, { params });
};
