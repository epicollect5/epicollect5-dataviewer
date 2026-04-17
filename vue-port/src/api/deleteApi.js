import client from '@/api/client';
import PARAMETERS from '@/config/parameters';

export const deleteEntry = (projectSlug, payload) => {
  return client.post(`${PARAMETERS.API_DELETION_ENDPOINT}${projectSlug}`, payload);
};
