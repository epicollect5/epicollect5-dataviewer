import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import client from '@/services/api/client';
import { mapTableRowsToGrid } from '@/core/entries/ag-grid/columnDefs';
import { deleteEntry as deleteEntryRequest } from '@/services/api/deleteApi';
import { fetchEntries } from '@/services/api/entriesApi';
import {
  getCachedEntriesPage,
  getEntriesRequestUrl,
  getPayloadSelfUrl,
  getProjectCacheRef,
  setCachedEntriesPage
} from '@/services/entries/entriesPageCache';
import tableModel from '@/core/entries/tableModel';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

export const TABLE_CACHE_HIT_DELAY_MS = 1000;

const tableRowsContext = {
  gridRows: markRaw([])
};

const clearTableRows = () => {
  tableRowsContext.gridRows = markRaw([]);
};

const setTableRows = (rows = []) => {
  const rawRows = markRaw(rows);
  const flatRows = rawRows.map((cells, index) => ({
    id: cells[0]?.entryUuid || `row-${index}`,
    rowIndex: index,
    cells
  }));

  tableRowsContext.gridRows = markRaw(mapTableRowsToGrid(flatRows));

  return tableRowsContext.gridRows.length;
};

const getCachedRows = (rowsVersion, rows) => {
  if (rowsVersion < 0) {
    return markRaw([]);
  }

  return rows;
};

const getImmediateChildForm = (forms = [], currentFormRef = '') => {
  const currentFormIndex = forms.findIndex((form) => form.ref === currentFormRef);

  if (currentFormIndex < 0 || currentFormIndex >= forms.length - 1) {
    return null;
  }

  return forms[currentFormIndex + 1] || null;
};

const delay = (duration) => new Promise((resolve) => {
  window.setTimeout(resolve, duration);
});

export const useTableStore = defineStore('table', {
  state: () => {
    clearTableRows();

    return {
      headers: [],
      childFormName: 'Children',
      hasChildForm: false,
      rowCount: 0,
      rowsVersion: 0,
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
    };
  },
  getters: {
    gridRows(state) {
      return getCachedRows(state.rowsVersion, tableRowsContext.gridRows);
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
        const shouldUseCache = Boolean(options.pageUrl);
        const requestParams = options.pageUrl ? this.requestParams : this.buildEntriesParams(options.params);
        const requestUrl = getEntriesRequestUrl({
          pageUrl: options.pageUrl,
          projectSlug: projectStore.projectSlug,
          params: requestParams
        });
        const projectRef = getProjectCacheRef(projectStore);
        const cachedResponseData = shouldUseCache ? await getCachedEntriesPage({ projectRef, requestUrl }) : null;
        let responseData = cachedResponseData;

        if (responseData) {
          await delay(TABLE_CACHE_HIT_DELAY_MS);
        } else {
          const response = options.pageUrl
            ? await client.get(options.pageUrl)
            : await fetchEntries(projectStore.projectSlug, requestParams);

          responseData = response.data;

          const selfUrl = getPayloadSelfUrl(responseData);
          const cacheUrl = selfUrl || requestUrl;

          if (shouldUseCache) {
            const cacheWrites = [
              setCachedEntriesPage({ projectRef, requestUrl: cacheUrl, payload: responseData })
            ];

            if (cacheUrl !== requestUrl) {
              cacheWrites.push(setCachedEntriesPage({ projectRef, requestUrl, payload: responseData }));
            }

            void Promise.all(cacheWrites).catch(() => {});
          }
        }

        const formRef = navigationStore.currentFormRef;

        this.requestParams = requestParams;
        this.headers = tableModel.getHeaders(projectStore.projectExtra, formRef);
        const childForm = getImmediateChildForm(projectStore.forms, formRef);

        this.hasChildForm = Boolean(childForm);
        this.childFormName = childForm?.name || 'Children';
        this.rowCount = setTableRows(tableModel.getRows(projectStore.projectSlug, projectStore.projectExtra, formRef, responseData));
        this.rowsVersion += 1;
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
