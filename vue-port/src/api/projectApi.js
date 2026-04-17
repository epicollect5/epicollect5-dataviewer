import client from '@/api/client';
import PARAMETERS from '@/config/parameters';

export const fetchProject = (projectSlug) => {
  return client.get(`${PARAMETERS.API_PROJECT_ENDPOINT}${projectSlug}`);
};
