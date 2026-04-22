import { defineStore } from 'pinia';
import { fetchEntriesLocations, fetchEntry } from '@/services/api/entriesApi';
import mapUtils from '@/core/map/mapUtils';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const getLocationQuestions = (projectExtra, formRef) => {
  return projectExtra?.forms?.[formRef]?.lists?.location_inputs || [];
};

export const useMapStore = defineStore('map', {
  state: () => ({
    locations: [],
    filteredLocations: [],
    markers: [],
    hasLoadedInitialPage: false,
    lastLoadedProjectSlug: '',
    selectedLocationQuestion: null,
    selectedEntry: null,
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
    }
  },
  actions: {
    reset() {
      this.locations = [];
      this.filteredLocations = [];
      this.markers = [];
      this.hasLoadedInitialPage = false;
      this.lastLoadedProjectSlug = '';
      this.selectedLocationQuestion = null;
      this.selectedEntry = null;
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
      this.locations = [];
      this.filteredLocations = [];
      this.markers = [];
      this.hasLoadedInitialPage = true;
      this.selectedLocationQuestion = null;
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
      const markerPayload = mapUtils.buildMarkerItems(nextVisibleLocations, this.clustersEnabled);

      this.filteredLocations = nextVisibleLocations;
      this.progressBarIsVisible = true;
      this.progressBarMarkersProcessed = markerPayload.processedCount;
      this.progressBarMarkersTotal = markerPayload.totalCount;
      this.progressBarPercentage =
        markerPayload.totalCount > 0 ? Math.round((markerPayload.processedCount / markerPayload.totalCount) * 100) : 0;
      this.markers = markerPayload.markers;
      this.progressBarIsVisible = false;
    },

    setClustersEnabled(enabled) {
      this.clustersEnabled = enabled;
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

      this.isFetchingPage = true;
      this.isRejectedPage = false;
      this.errors = [];
      this.selectedLocationQuestion = selectedLocationQuestion;
      this.syncDateBounds();

      if (options.resetFilters) {
        this.startDate = '';
        this.endDate = '';
      }

      try {
        const response = await fetchEntriesLocations(projectStore.projectSlug, this.buildLocationsParams({ selectedLocationQuestion }));
        const payload = response.data;

        this.locations = payload.data?.geojson?.features || [];
        this.pagination = payload.meta;
        this.links = payload.links;
        this.selectedEntry = null;
        this.recomputeMarkers();
      } catch (error) {
        this.isRejectedPage = true;
        this.errors = error.response?.data?.errors || [error.message];
        this.locations = [];
        this.filteredLocations = [];
        this.markers = [];
      } finally {
        this.isFetchingPage = false;
        this.hasLoadedInitialPage = true;
      }
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
