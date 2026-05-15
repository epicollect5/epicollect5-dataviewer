import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import client from '@/services/api/client';
import { fetchEntriesLocations, fetchEntry } from '@/services/api/entriesApi';
import {
  getCachedEntriesLocations,
  getEntriesLocationsRequestUrl,
  getPayloadSelfUrl,
  getProjectCacheRef,
  setCachedEntriesLocations
} from '@/services/entries/entriesPageCache';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import PARAMETERS from '@/core/config/parameters';
import tableModel from '@/core/entries/tableModel';
import mapUtils from '@/core/map/mapUtils';

export const MAP_CACHE_HIT_DELAY_MS = 1000;

const getLocationQuestions = (projectExtra, formRef) => {
  return projectExtra?.forms?.[formRef]?.lists?.location_inputs || [];
};

const getLocationQuestionKey = (question) => {
  if (!question) {
    return '';
  }

  return `${question.branch_ref || ''}:${question.input_ref || ''}`;
};

let pendingLocationsRequest = null;
let pendingLocationsRequestKey = '';

const rawArray = (items = []) => markRaw(items);

const delay = (duration) => new Promise((resolve) => {
  window.setTimeout(resolve, duration);
});

export const useMapStore = defineStore('map', {
  state: () => ({
    locations: rawArray(),
    filteredLocations: rawArray(),
    markers: rawArray(),
    hasLoadedInitialPage: false,
    lastLoadedProjectSlug: '',
    lastLoadedFormRef: '',
    lastLoadedLocationQuestionKey: '',
    selectedLocationQuestion: null,
    selectedDistributionQuestion: null,
    selectedEntry: null,
    requestParams: {},
    pagination: null,
    links: null,
    minDate: '',
    maxDate: '',
    startDate: '',
    endDate: '',
    progressBarIsVisible: false,
    progressBarMarkersProcessed: 0,
    progressBarMarkersTotal: 0,
    progressBarPercentage: 0,
    clustersEnabled: true,
    isFetchingPage: false,
    isFetchingEntry: false,
    isRejectedPage: false,
    errors: []
  }),
  getters: {
    visibleLocations(state) {
      return state.filteredLocations.length > 0 || state.startDate || state.endDate ? state.filteredLocations : state.locations;
    },
    selectedEntryTitle(state) {
      if (!state.selectedEntry) {
        return '';
      }

      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      if (!projectStore.projectSlug || !projectStore.projectExtra || !navigationStore.currentFormRef) {
        return '';
      }

      const branchRef = state.selectedLocationQuestion?.branch_ref || '';
      const rows = tableModel.getRows(
        projectStore.projectSlug,
        projectStore.projectExtra,
        navigationStore.currentFormRef,
        state.selectedEntry,
        branchRef
      );
      const titleIndex = branchRef
        ? PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX - 1
        : PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX;
      const uuidIndex = 0;

      return rows[0]?.[titleIndex]?.answer || rows[0]?.[uuidIndex]?.entryUuid || '';
    }
  },
  actions: {
    reset() {
      pendingLocationsRequest = null;
      pendingLocationsRequestKey = '';
      this.locations = rawArray();
      this.filteredLocations = rawArray();
      this.markers = rawArray();
      this.hasLoadedInitialPage = false;
      this.lastLoadedProjectSlug = '';
      this.lastLoadedFormRef = '';
      this.lastLoadedLocationQuestionKey = '';
      this.selectedLocationQuestion = null;
      this.selectedDistributionQuestion = null;
      this.selectedEntry = null;
      this.requestParams = {};
      this.pagination = null;
      this.links = null;
      this.minDate = '';
      this.maxDate = '';
      this.startDate = '';
      this.endDate = '';
      this.progressBarIsVisible = false;
      this.progressBarMarkersProcessed = 0;
      this.progressBarMarkersTotal = 0;
      this.progressBarPercentage = 0;
      this.clustersEnabled = true;
      this.isFetchingPage = false;
      this.isFetchingEntry = false;
      this.isRejectedPage = false;
      this.errors = [];
    },

    getLocationQuestions() {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      return getLocationQuestions(projectStore.projectExtra, navigationStore.currentFormRef);
    },

    getDefaultLocationQuestion() {
      return this.getLocationQuestions()[0] || null;
    },

    syncDateBounds() {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const bounds = mapUtils.getDateBounds({
        projectStats: projectStore.projectStats,
        currentFormRef: navigationStore.currentFormRef,
        projectCreatedAt: projectStore.projectDefinition?.project?.created_at
      });

      this.minDate = bounds.minDate;
      this.maxDate = bounds.maxDate;
    },

    clearForFormWithoutLocation() {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      this.locations = rawArray();
      this.filteredLocations = rawArray();
      this.markers = rawArray();
      this.hasLoadedInitialPage = true;
      this.lastLoadedProjectSlug = projectStore.projectSlug;
      this.lastLoadedFormRef = navigationStore.currentFormRef || '';
      this.lastLoadedLocationQuestionKey = '';
      this.selectedLocationQuestion = null;
      this.selectedDistributionQuestion = null;
      this.pagination = null;
      this.links = null;
      this.syncDateBounds();
      this.startDate = '';
      this.endDate = '';
      this.progressBarMarkersProcessed = 0;
      this.progressBarMarkersTotal = 0;
      this.progressBarPercentage = 0;
    },

    buildLocationsParams(overrides = {}) {
      const navigationStore = useNavigationStore();
      const selectedLocationQuestion = overrides.selectedLocationQuestion || this.selectedLocationQuestion || this.getDefaultLocationQuestion();
      const params = {
        form_ref: navigationStore.currentFormRef,
        input_ref: selectedLocationQuestion?.input_ref,
        branch_ref: selectedLocationQuestion?.branch_ref || '',
        ...overrides
      };

      delete params.selectedLocationQuestion;

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      return params;
    },

    recomputeMarkers() {
      const nextVisibleLocations = mapUtils.filterLocationsByDate(this.locations, this.startDate, this.endDate);

      const rawVisibleLocations = rawArray(nextVisibleLocations);

      this.filteredLocations = rawVisibleLocations;
      this.markers = rawVisibleLocations;
      this.progressBarMarkersProcessed = 0;
      this.progressBarMarkersTotal = nextVisibleLocations.length;
      this.progressBarPercentage = 0;
    },

    setClustersEnabled(enabled) {
      this.clustersEnabled = enabled;
      this.recomputeMarkers();
    },

    setDistributionQuestion(question) {
      this.selectedDistributionQuestion = question || null;
      this.recomputeMarkers();
    },

    resetDistributionQuestion() {
      this.selectedDistributionQuestion = null;
      this.recomputeMarkers();
    },

    setDateFilter(startDate, endDate) {
      this.startDate = startDate || '';
      this.endDate = endDate || '';
      this.recomputeMarkers();
    },

    resetDateFilter() {
      this.startDate = '';
      this.endDate = '';
      this.recomputeMarkers();
    },

    async loadLocations(options = {}) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      if (!projectStore.projectSlug || !navigationStore.currentFormRef) {
        return;
      }

      if (this.lastLoadedProjectSlug !== projectStore.projectSlug) {
        this.hasLoadedInitialPage = false;
        this.lastLoadedProjectSlug = projectStore.projectSlug;
      }

      const locationQuestions = this.getLocationQuestions();

      if (locationQuestions.length === 0) {
        this.clearForFormWithoutLocation();
        return;
      }

      const selectedLocationQuestion =
        options.selectedLocationQuestion ||
        this.selectedLocationQuestion ||
        this.getDefaultLocationQuestion();
      const locationQuestionKey = getLocationQuestionKey(selectedLocationQuestion);
      const pageUrl = options.pageUrl || '';
      const requestContextKey = `${projectStore.projectSlug}|${navigationStore.currentFormRef}|${locationQuestionKey}|${pageUrl}`;

      if (
        !pageUrl &&
        this.hasLoadedInitialPage &&
        this.lastLoadedProjectSlug === projectStore.projectSlug &&
        this.lastLoadedFormRef === navigationStore.currentFormRef &&
        this.lastLoadedLocationQuestionKey === locationQuestionKey
      ) {
        this.isRejectedPage = false;
        this.errors = [];
        this.selectedLocationQuestion = selectedLocationQuestion;
        this.syncDateBounds();

        if (options.resetFilters) {
          this.startDate = '';
          this.endDate = '';
          this.recomputeMarkers();
        }

        return;
      }

      if (pendingLocationsRequest && pendingLocationsRequestKey === requestContextKey) {
        return pendingLocationsRequest;
      }

      this.isFetchingPage = true;
      this.isRejectedPage = false;
      this.errors = [];
      this.selectedLocationQuestion = selectedLocationQuestion;
      this.syncDateBounds();

      if (options.resetFilters) {
        this.startDate = '';
        this.endDate = '';
      }

      pendingLocationsRequestKey = requestContextKey;
      pendingLocationsRequest = (async () => {
        try {
          const shouldUseCache = Boolean(pageUrl);
          const requestParams = pageUrl
            ? this.requestParams
            : this.buildLocationsParams({ selectedLocationQuestion });
          const requestUrl = getEntriesLocationsRequestUrl({
            pageUrl,
            projectSlug: projectStore.projectSlug,
            params: requestParams
          });
          const projectRef = getProjectCacheRef(projectStore);
          const cachedPayload = shouldUseCache ? await getCachedEntriesLocations({ projectRef, requestUrl }) : null;
          let payload = cachedPayload;

          if (payload) {
            await delay(MAP_CACHE_HIT_DELAY_MS);
          } else {
            const response = pageUrl
              ? await client.get(pageUrl)
              : await fetchEntriesLocations(projectStore.projectSlug, requestParams);

            payload = response.data;

            const canonicalPageUrl = getPayloadSelfUrl(payload);
            const cacheUrl = canonicalPageUrl || requestUrl;

            if (shouldUseCache) {
              const cacheWrites = [
                setCachedEntriesLocations({ projectRef, requestUrl: cacheUrl, payload })
              ];

              if (cacheUrl !== requestUrl) {
                cacheWrites.push(setCachedEntriesLocations({ projectRef, requestUrl, payload }));
              }

              void Promise.all(cacheWrites).catch(() => {});
            }
          }

          this.requestParams = requestParams;
          this.locations = rawArray(payload.data?.geojson?.features || []);
          this.pagination = payload.meta;
          this.links = payload.links || payload.link || null;
          this.selectedEntry = null;
          this.lastLoadedProjectSlug = projectStore.projectSlug;
          this.lastLoadedFormRef = navigationStore.currentFormRef;
          this.lastLoadedLocationQuestionKey = locationQuestionKey;
          this.recomputeMarkers();
        } catch (error) {
          this.isRejectedPage = true;
          this.errors = error.response?.data?.errors || [error.message];
          this.locations = rawArray();
          this.filteredLocations = rawArray();
          this.markers = rawArray();
        } finally {
          this.isFetchingPage = false;
          this.hasLoadedInitialPage = true;

          if (pendingLocationsRequestKey === requestContextKey) {
            pendingLocationsRequest = null;
            pendingLocationsRequestKey = '';
          }
        }
      })();

      return pendingLocationsRequest;
    },

    async loadEntry(entryUuid) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const branchRef = this.selectedLocationQuestion?.branch_ref || '';

      if (!projectStore.projectSlug || !navigationStore.currentFormRef || !entryUuid) {
        return;
      }

      this.isFetchingEntry = true;

      try {
        const response = await fetchEntry(projectStore.projectSlug, {
          form_ref: navigationStore.currentFormRef,
          uuid: entryUuid,
          branch_ref: branchRef
        });

        this.selectedEntry = response.data;
      } catch (error) {
        this.errors = error.response?.data?.errors || [error.message];
        this.selectedEntry = null;
      } finally {
        this.isFetchingEntry = false;
      }
    }
  }
});
