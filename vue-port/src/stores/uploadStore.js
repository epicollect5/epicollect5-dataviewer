import { defineStore } from 'pinia';
import { buildUploadRowPairs } from '@/core/upload/uploadRowPairing';
import { prepareUploadFile, uploadPreparedEntries } from '@/services/upload/uploadWorkflow';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

export const useUploadStore = defineStore('upload', {
  state: () => ({
    activeMappingIndex: 0,
    uploadedRows: [],
    bulkUploadableHeaders: [],
    reverseEntries: [],
    failedReverseEntries: [],
    reverseMapping: [],
    filterByFailed: false,
    generatedUuids: [],
    uploadResults: [],
    parsingError: '',
    isPreparing: false,
    isUploading: false
  }),
  getters: {
    activeMapping(state) {
      const projectStore = useProjectStore();
      return projectStore.projectMapping[state.activeMappingIndex] || projectStore.projectMapping[0] || null;
    },
    uploadProgress(state) {
      if (state.reverseEntries.length === 0) {
        return 0;
      }

      return Math.round((state.uploadResults.length / state.reverseEntries.length) * 100);
    },
    pairedRows(state) {
      return buildUploadRowPairs({
        uploadedRows: state.uploadedRows,
        reverseEntries: state.reverseEntries,
        responses: state.uploadResults,
        reverseMapping: state.reverseMapping,
        generatedUuids: state.generatedUuids,
        filterByFailed: state.filterByFailed
      });
    },
    availableHeaders(state) {
      return state.uploadedRows[0] ? Object.keys(state.uploadedRows[0]) : [];
    }
  },
  actions: {
    reset() {
      this.uploadedRows = [];
      this.bulkUploadableHeaders = [];
      this.reverseEntries = [];
      this.failedReverseEntries = [];
      this.reverseMapping = [];
      this.filterByFailed = false;
      this.generatedUuids = [];
      this.uploadResults = [];
      this.parsingError = '';
      this.isPreparing = false;
      this.isUploading = false;
    },

    setActiveMapping(index) {
      this.activeMappingIndex = index;
    },

    setFilterByFailed(status) {
      this.filterByFailed = status;
    },

    async prepareFile(file) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const activeMapping = this.activeMapping;

      this.parsingError = '';

      this.isPreparing = true;
      this.uploadResults = [];
      this.failedReverseEntries = [];
      this.filterByFailed = false;

      try {
        const result = await prepareUploadFile({
          file,
          activeMapping,
          projectSlug: projectStore.projectSlug,
          projectExtra: projectStore.projectExtra,
          projectDefinition: projectStore.projectDefinition,
          projectMapping: projectStore.projectMapping,
          projectStats: projectStore.projectStats,
          currentFormRef: navigationStore.currentFormRef,
          navigationStore
        });

        if (!result.success) {
          this.parsingError = result.parsingError;
          return false;
        }

        this.uploadedRows = result.data.uploadedRows;
        this.bulkUploadableHeaders = result.data.bulkUploadableHeaders;
        this.reverseEntries = result.data.reverseEntries;
        this.reverseMapping = result.data.reverseMapping;
        this.generatedUuids = result.data.generatedUuids;

        return true;
      } finally {
        this.isPreparing = false;
      }
    },

    async uploadPreparedEntries() {
      const projectStore = useProjectStore();

      if (this.reverseEntries.length === 0) {
        return;
      }

      this.isUploading = true;
      this.uploadResults = [];
      this.failedReverseEntries = [];

      try {
        const result = await uploadPreparedEntries({
          projectSlug: projectStore.projectSlug,
          reverseEntries: this.reverseEntries
        });

        this.uploadResults = result.uploadResults;
        this.failedReverseEntries = result.failedReverseEntries;
      } finally {
        this.isUploading = false;
      }
    }
  }
});
