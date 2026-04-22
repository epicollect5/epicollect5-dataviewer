import client from '@/services/api/client';
import PARAMETERS from '@/core/config/parameters';

export const fetchProject = (projectSlug) => {
  return client.get(`${PARAMETERS.API_PROJECT_ENDPOINT}${projectSlug}`);
};
