import Papa from 'papaparse';
import { defineStore } from 'pinia';
import PARAMETERS from '@/config/parameters';
import reverseEntryParser from '@/core/entries/reverseEntryParser';
import { buildUploadRowPairs } from '@/core/upload/uploadRowPairing';
import helpers from '@/utils/helpers';
import { fetchUploadHeaders, uploadEntryWithResult } from '@/api/uploadApi';
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

      if (!file) {
        return false;
      }

      if (!file.name.endsWith(`.${PARAMETERS.FORMAT_CSV}`)) {
        this.parsingError = PARAMETERS.LABELS.FILE_UPLOAD_ERROR;
        return false;
      }

      if (file.size > PARAMETERS.BULK_MAX_FILE_SIZE_BYTES) {
        this.parsingError = PARAMETERS.LABELS.FILE_SIZE_ERROR;
        return false;
      }

      if (!activeMapping || !projectStore.projectDefinition.project) {
        this.parsingError = PARAMETERS.LABELS.FILE_UPLOAD_ERROR;
        return false;
      }

      this.isPreparing = true;
      this.uploadResults = [];
      this.failedReverseEntries = [];
      this.filterByFailed = false;

      try {
        const content = await file.text();
        const parsed = Papa.parse(content, {
          header: true,
          skipEmptyLines: true
        });

        if (parsed.errors.length > 0) {
          this.parsingError = PARAMETERS.LABELS.FILE_UPLOAD_ERROR;
          return false;
        }

        const rows = parsed.data.slice(0, PARAMETERS.TABLE_UPLOAD_MAX_ROWS).map((row) => {
          const trimmed = {};

          Object.entries(row).forEach(([key, value]) => {
            trimmed[key.trim()] = typeof value === 'string' ? value.trim() : value;
          });

          return trimmed;
        });

        if (rows.length === 0) {
          this.parsingError = PARAMETERS.LABELS.FILE_UPLOAD_ERROR_NO_ROWS;
          return false;
        }

        const currentFormRef = navigationStore.currentFormRef;
        const forms = projectStore.projectDefinition.project.forms;
        const formIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
        const currentFormMapping = activeMapping.forms[currentFormRef];
        const reverseMapping = reverseEntryParser.getReverseMapping(
          currentFormRef,
          currentFormMapping,
          projectStore.projectExtra,
          projectStore.projectDefinition,
          null
        );

        const headersResponse = await fetchUploadHeaders(projectStore.projectSlug, {
          map_index: activeMapping.map_index,
          form_index: formIndex,
          branch_ref: '',
          format: 'json'
        });

        const bulkUploadableHeaders = headersResponse.data.data.headers;
        const parsedHeaders = parsed.meta.fields.map((header) => header.trim());

        if (!bulkUploadableHeaders.every((header) => parsedHeaders.includes(header))) {
          this.parsingError = PARAMETERS.LABELS.FILE_MAPPING_ERROR;
          return false;
        }

        const branches = Object.keys(projectStore.projectExtra.forms[currentFormRef].branch || {});
        const reverseAnswers = reverseEntryParser.getReverseAnswers(
          rows,
          reverseMapping,
          branches,
          null,
          projectStore.projectExtra.inputs
        );
        const groupRefs = projectStore.projectExtra.forms[currentFormRef].group || {};

        Object.keys(groupRefs).forEach((groupInputRef) => {
          reverseAnswers.forEach((reverseAnswer) => {
            reverseAnswer.answer[groupInputRef] = {
              answer: '',
              was_jumped: false
            };
          });
        });

        const parentFormForUpload =
          navigationStore.hierarchyNavigator.length > 1
            ? helpers.getParentFormForUpload(navigationStore.hierarchyNavigator, currentFormRef)
            : { parentFormRef: null, parentEntryUuid: null };

        const generatedUuids = [];
        const entries = reverseAnswers.map((reverseAnswer) => {
          let uuid = reverseAnswer.uuid;

          if (!uuid) {
            uuid = helpers.generateUuid();
            generatedUuids.push(uuid);
          }

          return reverseEntryParser.getEntry({
            currentBranchRef: null,
            uuid,
            currentFormRef,
            entryTitle: reverseAnswer.title,
            reverseAnswer,
            projectVersion: projectStore.projectStats.structure_last_updated,
            parentEntryUuid: parentFormForUpload.parentEntryUuid,
            parentFormRef: parentFormForUpload.parentFormRef,
            currentBranchOwnerUuid: null
          });
        });

        this.uploadedRows = rows;
        this.bulkUploadableHeaders = bulkUploadableHeaders;
        this.reverseEntries = entries;
        this.reverseMapping = reverseMapping;
        this.generatedUuids = generatedUuids;

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
        for (let index = 0; index < this.reverseEntries.length; index += 1) {
          const entry = this.reverseEntries[index];
          const result = await uploadEntryWithResult(projectStore.projectSlug, entry);

          this.uploadResults.push(result);

          if (result.status === 'error') {
            this.failedReverseEntries.push(entry);
          }
        }
      } finally {
        this.isUploading = false;
      }
    }
  }
});
