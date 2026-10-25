import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import client from '@/services/api/client';
import { fetchEntriesLocationsCompact, fetchEntry } from '@/services/api/entriesApi';
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
import { mergeCompactLocationPayloads } from '@/core/map/compactLocations';
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
let activeLocationsRequestKey = '';

const rawArray = (items = []) => markRaw(items);

const delay = (duration) => new Promise((resolve) => {
  window.setTimeout(resolve, duration);
});

const getChunkLastPage = (payload = {}) => {
  return Math.max(Number(payload.meta?.chunk_last_page) || 1, 1);
};

const getChunksPerMapPage = (payload = {}) => {
  const perPage = Number(payload.meta?.per_page) || 0;
  const perChunk = Number(payload.meta?.per_chunk) || 0;

  if (perPage <= 0 || perChunk <= 0) {
    return 1;
  }

  return Math.max(Math.ceil(perPage / perChunk), 1);
};

const getChunkPageUrl = (pageUrl, page) => {
  const nextPageUrl = new URL(pageUrl, client.defaults.baseURL);

  nextPageUrl.searchParams.set('page', page);

  return nextPageUrl.toString();
};

const getChunkPageFromUrl = (pageUrl) => {
  if (!pageUrl) {
    return 1;
  }

  const parsedUrl = new URL(pageUrl, client.defaults.baseURL);

  return Math.max(Number(parsedUrl.searchParams.get('page')) || 1, 1);
};

const getMapPageLinks = ({ sourceUrl, firstChunkPage, chunksPerMapPage, chunkLastPage }) => {
  return {
    self: getChunkPageUrl(sourceUrl, firstChunkPage),
    prev: firstChunkPage > 1
      ? getChunkPageUrl(sourceUrl, Math.max(firstChunkPage - chunksPerMapPage, 1))
      : null,
    next: firstChunkPage + chunksPerMapPage <= chunkLastPage
      ? getChunkPageUrl(sourceUrl, firstChunkPage + chunksPerMapPage)
      : null
  };
};

const getMapPageMeta = ({ meta, firstChunkPage, lastRequestedChunkPage, chunksPerMapPage }) => {
  const total = Number(meta?.total) || 0;
  const perPage = Number(meta?.per_page) || 0;
  const computedLastPage = perPage > 0 ? Math.max(Math.ceil(total / perPage), 1) : meta?.last_page;
  const currentPage = Math.floor((firstChunkPage - 1) / chunksPerMapPage) + 1;

  return {
    ...meta,
    current_page: currentPage,
    last_page: computedLastPage || meta?.last_page || 1,
    chunk_page: firstChunkPage,
    chunk_to: lastRequestedChunkPage
  };
};

export const useMapStore = defineStore('map', {
  state: () => ({
    locations: rawArray(),
    possibleAnswerMap: rawArray(),
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
      const formRef = state.lastLoadedFormRef || navigationStore.currentFormRef;

      if (!projectStore.projectSlug || !projectStore.projectExtra || !formRef) {
        return '';
      }

      const branchRef = state.selectedLocationQuestion?.branch_ref || '';
      const rows = tableModel.getRows(
        projectStore.projectSlug,
        projectStore.projectExtra,
        formRef,
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
      activeLocationsRequestKey = '';
      this.locations = rawArray();
      this.possibleAnswerMap = rawArray();
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

    async fetchCompactLocationPayload(projectSlug, requestParams, pageUrl = '', requestUrl = '') {
      const firstResponse = pageUrl
        ? await client.get(pageUrl)
        : await fetchEntriesLocationsCompact(projectSlug, requestParams);
      const firstPayload = firstResponse.data;
      const firstChunkPage = Number(firstPayload.meta?.chunk_page) || getChunkPageFromUrl(pageUrl) || Number(requestParams.page) || 1;
      const chunkLastPage = getChunkLastPage(firstPayload);
      const chunksPerMapPage = getChunksPerMapPage(firstPayload);
      const lastRequestedChunkPage = Math.min(firstChunkPage + chunksPerMapPage - 1, chunkLastPage);

      if (lastRequestedChunkPage <= firstChunkPage) {
        const mergedPayload = mergeCompactLocationPayloads([firstPayload]);
        const sourceUrl = getPayloadSelfUrl(mergedPayload) || pageUrl || requestUrl;

        return {
          ...mergedPayload,
          meta: getMapPageMeta({
            meta: mergedPayload.meta,
            firstChunkPage,
            lastRequestedChunkPage,
            chunksPerMapPage
          }),
          links: getMapPageLinks({
            sourceUrl,
            firstChunkPage,
            chunksPerMapPage,
            chunkLastPage
          })
        };
      }

      const chunkRequests = [];

      for (let page = firstChunkPage + 1; page <= lastRequestedChunkPage; page += 1) {
        chunkRequests.push(
          pageUrl
            ? client.get(getChunkPageUrl(pageUrl, page))
            : fetchEntriesLocationsCompact(projectSlug, {
              ...requestParams,
              page
            })
        );
      }

      const chunkResponses = await Promise.all(chunkRequests);
      const mergedPayload = mergeCompactLocationPayloads([
        firstPayload,
        ...chunkResponses.map((response) => response.data)
      ]);
      const sourceUrl = getPayloadSelfUrl(mergedPayload) || pageUrl || requestUrl;

      return {
        ...mergedPayload,
        meta: getMapPageMeta({
          meta: mergedPayload.meta,
          firstChunkPage,
          lastRequestedChunkPage,
          chunksPerMapPage
        }),
        links: getMapPageLinks({
          sourceUrl,
          firstChunkPage,
          chunksPerMapPage,
          chunkLastPage
        })
      };
    },

    //formRef is optional: it lets the map hold the locations of another form than
    //the current one, as legacy does after a data editor round trip
    getLocationQuestions(formRef = '') {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      return getLocationQuestions(projectStore.projectExtra, formRef || navigationStore.currentFormRef);
    },

    getDefaultLocationQuestion(formRef = '') {
      return this.getLocationQuestions(formRef)[0] || null;
    },

    syncDateBounds(formRef = '') {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const bounds = mapUtils.getDateBounds({
        projectStats: projectStore.projectStats,
        currentFormRef: formRef || navigationStore.currentFormRef,
        projectCreatedAt: projectStore.projectDefinition?.project?.created_at
      });

      this.minDate = bounds.minDate;
      this.maxDate = bounds.maxDate;
    },

    clearForFormWithoutLocation(formRef = '') {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const resolvedFormRef = formRef || navigationStore.currentFormRef;

      this.locations = rawArray();
      this.possibleAnswerMap = rawArray();
      this.filteredLocations = rawArray();
      this.markers = rawArray();
      this.hasLoadedInitialPage = true;
      this.lastLoadedProjectSlug = projectStore.projectSlug;
      this.lastLoadedFormRef = resolvedFormRef || '';
      this.lastLoadedLocationQuestionKey = '';
      this.selectedLocationQuestion = null;
      this.selectedDistributionQuestion = null;
      this.pagination = null;
      this.links = null;
      this.syncDateBounds(resolvedFormRef);
      this.startDate = '';
      this.endDate = '';
      this.progressBarMarkersProcessed = 0;
      this.progressBarMarkersTotal = 0;
      this.progressBarPercentage = 0;
    },

    buildLocationsParams(overrides = {}) {
      const navigationStore = useNavigationStore();
      const formRef = overrides.formRef || navigationStore.currentFormRef;
      const selectedLocationQuestion = overrides.selectedLocationQuestion || this.selectedLocationQuestion || this.getDefaultLocationQuestion(formRef);
      const params = {
        form_ref: formRef,
        input_ref: selectedLocationQuestion?.input_ref,
        branch_ref: selectedLocationQuestion?.branch_ref || '',
        ...overrides
      };

      delete params.selectedLocationQuestion;
      delete params.formRef;

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
      //a page link continues the location set that is already loaded, which can
      //belong to another form than the current one (legacy restore behaviour)
      const pagedFormRef = options.pageUrl ? this.lastLoadedFormRef : '';
      const formRef = options.formRef || pagedFormRef || navigationStore.currentFormRef;

      if (!projectStore.projectSlug || !formRef) {
        return;
      }

      if (this.lastLoadedProjectSlug !== projectStore.projectSlug) {
        this.hasLoadedInitialPage = false;
        this.lastLoadedProjectSlug = projectStore.projectSlug;
      }

      const locationQuestions = this.getLocationQuestions(formRef);

      if (locationQuestions.length === 0) {
        this.clearForFormWithoutLocation(formRef);
        return;
      }

      const selectedLocationQuestion =
        options.selectedLocationQuestion ||
        (formRef === navigationStore.currentFormRef ? this.selectedLocationQuestion : null) ||
        this.getDefaultLocationQuestion(formRef);
      const locationQuestionKey = getLocationQuestionKey(selectedLocationQuestion);
      const pageUrl = options.pageUrl || '';
      const requestContextKey = `${projectStore.projectSlug}|${formRef}|${locationQuestionKey}|${pageUrl}`;

      if (
        !pageUrl &&
        this.hasLoadedInitialPage &&
        this.lastLoadedProjectSlug === projectStore.projectSlug &&
        this.lastLoadedFormRef === formRef &&
        this.lastLoadedLocationQuestionKey === locationQuestionKey
      ) {
        this.isRejectedPage = false;
        this.errors = [];
        this.selectedLocationQuestion = selectedLocationQuestion;
        this.syncDateBounds(formRef);

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
      this.syncDateBounds(formRef);

      if (options.resetFilters) {
        this.startDate = '';
        this.endDate = '';
      }

      pendingLocationsRequestKey = requestContextKey;
      activeLocationsRequestKey = requestContextKey;
      pendingLocationsRequest = (async () => {
        try {
          const shouldUseCache = Boolean(pageUrl);
          const requestParams = pageUrl
            ? this.requestParams
            : this.buildLocationsParams({ selectedLocationQuestion, formRef });
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
            payload = await this.fetchCompactLocationPayload(projectStore.projectSlug, requestParams, pageUrl, requestUrl);

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

          if (activeLocationsRequestKey !== requestContextKey) {
            return;
          }

          this.requestParams = requestParams;
          this.locations = rawArray(payload.data?.points || []);
          this.possibleAnswerMap = rawArray(payload.data?.pa_map || []);
          this.pagination = payload.meta;
          this.links = payload.links || payload.link || null;
          this.selectedEntry = null;
          this.lastLoadedProjectSlug = projectStore.projectSlug;
          this.lastLoadedFormRef = formRef;
          this.lastLoadedLocationQuestionKey = locationQuestionKey;
          this.recomputeMarkers();
        } catch (error) {
          if (activeLocationsRequestKey !== requestContextKey) {
            return;
          }

          this.isRejectedPage = true;
          this.errors = error.response?.data?.errors || [error.message];
          this.locations = rawArray();
          this.filteredLocations = rawArray();
          this.markers = rawArray();
        } finally {
          if (activeLocationsRequestKey === requestContextKey) {
            this.isFetchingPage = false;
            this.hasLoadedInitialPage = true;
          }

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
      //the marker belongs to the loaded location set, not to the table's form
      const formRef = this.lastLoadedFormRef || navigationStore.currentFormRef;

      if (!projectStore.projectSlug || !formRef || !entryUuid) {
        return;
      }

      this.isFetchingEntry = true;

      try {
        const response = await fetchEntry(projectStore.projectSlug, {
          form_ref: formRef,
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
