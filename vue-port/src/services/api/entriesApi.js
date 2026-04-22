import client from '@/services/api/client';
import PARAMETERS from '@/core/config/parameters';

export const fetchEntries = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_ENTRIES_ENDPOINT}${projectSlug}`, { params });
};

export const fetchEntriesLocations = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT}${projectSlug}`, { params });
};

export const fetchEntry = (projectSlug, params = {}) => {
  return client.get(`${PARAMETERS.API_ENTRIES_ENDPOINT}${projectSlug}`, { params });
};
