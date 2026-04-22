import client from '@/services/api/client';
import PARAMETERS from '@/core/config/parameters';

export const deleteEntry = (projectSlug, payload) => {
  return client.post(`${PARAMETERS.API_DELETION_ENDPOINT}${projectSlug}`, payload);
};
