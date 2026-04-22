import { defineStore } from 'pinia';
import client from '@/services/api/client';
import { deleteEntry as deleteEntryRequest } from '@/services/api/deleteApi';
import { fetchEntries } from '@/services/api/entriesApi';
import tableModel from '@/core/entries/tableModel';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

export const useTableStore = defineStore('table', {
  state: () => ({
    headers: [],
    rows: [],
    requestParams: {},
    pagination: null,
    links: null,
    hasLoadedInitialPage: false,
    lastLoadedProjectSlug: '',
    isFetchingPage: false,
    isRejectedPage: false,
    isBranchTable: false,
    isFetchingChildren: false,
    errors: []
  }),
  getters: {
    flatRows(state) {
      return state.rows.map((cells, index) => ({
        id: cells[0]?.entryUuid || `row-${index}`,
        rowIndex: index,
        cells
      }));
    }
  },
  actions: {
    buildEntriesParams(overrides = {}) {
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();
      const params = {
        form_ref: navigationStore.currentFormRef,
        title: filtersStore.filterByTitle || '',
        filter_from: filtersStore.startDate || '',
        filter_to: filtersStore.endDate || '',
        filter_by: filtersStore.startDate || filtersStore.endDate ? 'created_at' : '',
        sort_by: filtersStore.sortBy,
        sort_order: filtersStore.sortOrder,
        ...overrides
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      return params;
    },

    async loadEntries(options = {}) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();

      if (!projectStore.projectSlug || !navigationStore.currentFormRef) {
        return;
      }

      if (this.lastLoadedProjectSlug !== projectStore.projectSlug) {
        this.hasLoadedInitialPage = false;
        this.lastLoadedProjectSlug = projectStore.projectSlug;
      }

      this.isFetchingPage = true;
      this.isRejectedPage = false;
      this.errors = [];

      try {
        const response = options.pageUrl
          ? await client.get(options.pageUrl)
          : await fetchEntries(projectStore.projectSlug, this.buildEntriesParams(options.params));

        const responseData = response.data;
        const formRef = navigationStore.currentFormRef;

        this.requestParams = options.pageUrl ? this.requestParams : this.buildEntriesParams(options.params);
        this.headers = tableModel.getHeaders(projectStore.projectExtra, formRef);
        this.rows = tableModel.getRows(projectStore.projectSlug, projectStore.projectExtra, formRef, responseData);
        this.pagination = responseData.meta;
        this.links = responseData.links;
      } catch (error) {
        this.isRejectedPage = true;
        this.errors = error.response?.data?.errors || [error.message];
      } finally {
        this.isFetchingPage = false;
        this.hasLoadedInitialPage = true;
      }
    },

    async deleteCurrentEntry(payload = {}) {
      const projectStore = useProjectStore();

      if (!projectStore.projectSlug || !payload.entryUuid || !payload.entryExtra) {
        throw new Error('Delete payload is incomplete.');
      }

      const deletePayload = {
        data: {
          type: 'delete',
          id: payload.entryUuid,
          attributes: payload.entryExtra.attributes,
          relationships: payload.entryExtra.relationships,
          delete: {
            entry_uuid: payload.entryUuid
          }
        }
      };

      await deleteEntryRequest(projectStore.projectSlug, deletePayload);
      await this.loadEntries({ params: this.requestParams });
    }
  }
});
