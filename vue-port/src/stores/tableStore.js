import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import PARAMETERS from '@/core/config/parameters';
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
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const tableRowsContext = {
  gridRows: markRaw([])
};

const clearTableRows = () => {
  tableRowsContext.gridRows = markRaw([]);
};

const setTableRows = (rows = [], isBranchTable = false) => {
  const rawRows = markRaw(rows);
  const flatRows = rawRows.map((cells, index) => ({
    id: cells[0]?.entryUuid || `row-${index}`,
    rowIndex: index,
    cells
  }));

  tableRowsContext.gridRows = markRaw(mapTableRowsToGrid(flatRows, isBranchTable));

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

const appendHierarchyParams = (params, navigationStore) => {
  const hierarchyNavigator = navigationStore.hierarchyNavigator;
  const activeNavigator = hierarchyNavigator[hierarchyNavigator.length - 1];
  const parentNavigator = hierarchyNavigator[hierarchyNavigator.length - 2];

  //a branch table is scoped to its owner entry, never to a parent entry
  if (navigationStore.currentBranchRef) {
    params.branch_ref = navigationStore.currentBranchRef;
    params.branch_owner_uuid = navigationStore.currentBranchOwnerUuid;

    delete params.parent_form_ref;
    delete params.parent_uuid;

    return params;
  }

  delete params.branch_ref;
  delete params.branch_owner_uuid;

  if (hierarchyNavigator.length > 1 && activeNavigator?.parentEntryUuid) {
    params.parent_form_ref = parentNavigator?.formRef;
    params.parent_uuid = activeNavigator.parentEntryUuid;

    return params;
  }

  //drop any stale parent filter left over by a previous child view
  delete params.parent_form_ref;
  delete params.parent_uuid;

  return params;
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
      //the status of the last rejected page, telling a gone entry from a flaky network
      errorStatus: 0,
      isBranchTable: false,
      //the owner view a branch was opened from, replayed when the branch is left
      branchReturnView: null,
      isFetchingChildren: false,
      requestVersion: 0,
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

      appendHierarchyParams(params, navigationStore);

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

      const requestVersion = this.requestVersion + 1;
      this.requestVersion = requestVersion;

      this.isFetchingPage = true;
      this.isRejectedPage = false;
      this.errorStatus = 0;
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

        if (!responseData) {
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

        //the loader stays up for a minimum time, so it does not flash
        await delay(PARAMETERS.DELAY.TABLE_PAGE_MIN);

        //a newer request (navigation, filters or pagination) has taken over
        if (requestVersion !== this.requestVersion) {
          return;
        }

        const formRef = navigationStore.currentFormRef;
        const branchRef = navigationStore.currentBranchRef || '';

        this.requestParams = requestParams;
        this.headers = branchRef
          ? tableModel.getBranchHeaders(projectStore.projectExtra, formRef, branchRef)
          : tableModel.getHeaders(projectStore.projectExtra, formRef);
        const childForm = getImmediateChildForm(projectStore.forms, formRef);

        //a branch table has no children column, as legacy splices it out
        this.isBranchTable = Boolean(branchRef);
        this.hasChildForm = !branchRef && Boolean(childForm);
        this.childFormName = childForm?.name || 'Children';
        this.rowCount = setTableRows(
          tableModel.getRows(projectStore.projectSlug, projectStore.projectExtra, formRef, responseData, branchRef),
          Boolean(branchRef)
        );
        this.rowsVersion += 1;
        this.pagination = responseData.meta;
        this.links = responseData.links;
      } catch (error) {
        if (requestVersion !== this.requestVersion) {
          return;
        }

        this.isRejectedPage = true;
        this.errorStatus = error.response?.status || 0;
        this.errors = error.response?.data?.errors || [error.message];
      } finally {
        if (requestVersion === this.requestVersion) {
          this.isFetchingPage = false;
          this.hasLoadedInitialPage = true;
        }
      }
    },

    async loadChildEntries({ entryUuid, entryTitle } = {}) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();

      if (!projectStore.projectSlug || !navigationStore.currentFormRef || !entryUuid || this.isFetchingPage) {
        return;
      }

      const childForm = getImmediateChildForm(projectStore.forms, navigationStore.currentFormRef);

      if (!childForm) {
        return;
      }

      navigationStore.enterChildForm({
        formRef: childForm.ref,
        formName: childForm.name,
        parentEntryUuid: entryUuid,
        parentEntryTitle: entryTitle || ''
      });
      filtersStore.reset();

      await this.loadEntries({ params: { page: 1 } });
    },

    async loadBranchEntries({ entryUuid, entryTitle, branchRef } = {}) {
      const projectStore = useProjectStore();
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();

      if (!projectStore.projectSlug || !navigationStore.currentFormRef || !entryUuid || !branchRef || this.isFetchingPage) {
        return;
      }

      //a branch opened from another branch keeps the view of the outer owner form
      if (!navigationStore.isViewingBranch) {
        this.branchReturnView = {
          filters: filtersStore.snapshot(),
          page: this.pagination?.current_page || 1
        };
      }

      navigationStore.enterBranch({
        branchRef,
        ownerEntryUuid: entryUuid,
        ownerEntryTitle: entryTitle || '',
        backLink: this.links?.self || ''
      });
      filtersStore.reset();

      await this.loadEntries({ params: { page: 1 } });
    },

    setBranchReturnView(view = null) {
      this.branchReturnView = view;
    },

    async navigateBackFromBranch() {
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();

      if (!navigationStore.isViewingBranch) {
        return;
      }

      const branchReturnView = this.branchReturnView;

      navigationStore.leaveBranch();

      //the owner form comes back the way it was, not filtered and paginated afresh
      if (branchReturnView) {
        filtersStore.restore(branchReturnView.filters);
      } else {
        filtersStore.reset();
      }

      this.branchReturnView = null;

      await this.loadEntries({ params: { page: branchReturnView?.page || 1 } });
    },

    async navigateBack() {
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();

      //a request already in flight is discarded by the request version check
      if (!navigationStore.navigateBack()) {
        return;
      }

      filtersStore.reset();

      await this.loadEntries({ params: { page: 1 } });
    },

    async navigateToRoot() {
      const navigationStore = useNavigationStore();
      const filtersStore = useFiltersStore();

      //a request already in flight is discarded by the request version check
      if (!navigationStore.resetHierarchy()) {
        return;
      }

      filtersStore.reset();

      await this.loadEntries({ params: { page: 1 } });
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

      //the map draws the same entry, so its markers must not outlive the delete
      const navigationStore = useNavigationStore();
      const mapStore = useMapStore();

      if (navigationStore.activePage === 'map') {
        await mapStore.loadLocations({
          formRef: mapStore.lastLoadedFormRef || undefined,
          resetFilters: false
        });
      }
    }
  }
});
