<template>
  <section class="table-view">
    <div v-if="missingProjectSlug" class="placeholder-view">
      <h1>Project Required</h1>
      <p>Open the Vue port with `/project/your-project-slug/data`.</p>
    </div>

    <div v-else-if="state.projectStore.isRejected" class="placeholder-view">
      <h1>Project Load Failed</h1>
      <p>{{ projectErrors }}</p>
    </div>

    <template v-else>
      <NavbarSecondary>
        <template #start>
          <div v-if="isViewingBranch" class="table-view__hierarchy-nav">
            <button
              type="button"
              class="table-view__hierarchy-back"
              aria-label="Back to entry"
              title="Back to entry"
              :disabled="state.tableStore.isFetchingPage"
              @click="handleBranchBack"
            >
              <ion-icon :icon="arrowBack" />
            </button>
            <span class="table-view__hierarchy-label" :title="branchNavLabel">{{ branchNavLabel }}</span>
          </div>

          <div v-else-if="isViewingChildren" class="table-view__hierarchy-nav">
            <button
              type="button"
              class="table-view__hierarchy-back"
              aria-label="Back to parent form"
              title="Back to parent form"
              :disabled="state.tableStore.isFetchingPage"
              @click="handleHierarchyBack"
            >
              <ion-icon :icon="arrowBack" />
            </button>
            <span class="table-view__hierarchy-label" :title="hierarchyBackFormName">{{ hierarchyBackFormName }}</span>
          </div>
        </template>

        <template #end>
          <button
            v-if="addEntryAction.isVisible"
            type="button"
            class="table-view__add-entry"
            :aria-label="`Add ${addEntryAction.label}`"
            :title="`Add ${addEntryAction.label}`"
            @click="handleAddEntry"
          >
            <ion-icon :icon="addCircle" />
            <span class="table-view__add-entry-label">Add {{ addEntryAction.label }}</span>
          </button>

          <div v-if="hasPagination" class="secondary-navbar-pagination">
            <span>Total {{ state.tableStore.pagination.total }} | Page {{ state.tableStore.pagination.current_page }}/{{ state.tableStore.pagination.last_page }}</span>
            <button
              type="button"
              class="secondary-navbar-pagination__button"
              :disabled="isPreviousPageDisabled"
              aria-label="Previous page"
              title="Previous page"
              @click="handlePreviousPage"
            >
              <ion-icon :icon="chevronBackCircle" class="secondary-navbar-pagination__icon" />
            </button>
            <button
              type="button"
              class="secondary-navbar-pagination__button"
              :disabled="isNextPageDisabled"
              aria-label="Next page"
              title="Next page"
              @click="handleNextPage"
            >
              <ion-icon :icon="chevronForwardCircle" class="secondary-navbar-pagination__icon" />
            </button>
          </div>
        </template>
      </NavbarSecondary>

      <section class="table-view__layout">
        <TableToolbar
          :is-loading="state.tableStore.isFetchingPage"
          :filter-by-title="state.filtersStore.filterByTitle"
          :start-date="state.filtersStore.startDate"
          :end-date="state.filtersStore.endDate"
          :min-date="dateBounds.minDate"
          :max-date="dateBounds.maxDate"
          :selected-order-by="state.filtersStore.selectedOrderBy"
          @update:title="handleTitleChange"
          @update:start-date="handleDateChange"
          @update:end-date="handleDateChange"
          @update:order="handleOrderChange"
          @reset-filters="handleResetFilters"
        />

        <div class="table-view__content">
          <div v-if="state.tableStore.isRejectedPage" class="placeholder-view">
            <h1>Entries Load Failed</h1>
            <p>{{ tableErrors }}</p>
          </div>

          <TableEmptyState v-else-if="!state.tableStore.isFetchingPage && state.tableStore.rowCount === 0" />

          <EntriesGrid
            v-else
            :headers="state.tableStore.headers"
            :has-child-form="state.tableStore.hasChildForm"
            :child-form-name="state.tableStore.childFormName"
            :can-add-entry="canAddEntry"
            :rows="state.tableStore.gridRows"
            :is-loading="state.tableStore.isFetchingPage"
          />
        </div>

        <footer class="table-view__footer">
          <button type="button" class="table-view__upload-button" @click="handleOpenUpload">
            <ion-icon :icon="cloudUpload" />
            <span>Upload</span>
          </button>
        </footer>
      </section>
    </template>
  </section>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { addCircle, arrowBack, chevronBackCircle, chevronForwardCircle, cloudUpload } from 'ionicons/icons';
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavbarSecondary from '@/components/main/NavbarSecondary.vue';
import env from '@/core/config/env';
import EntriesGrid from '@/components/table/GridEntries.vue';
import TableEmptyState from '@/components/table/StateEmptyTable.vue';
import TableToolbar from '@/components/table/ToolbarTable.vue';
import { getOrderSorting } from '@/core/entries/orderSorting';
import mapUtils from '@/core/map/mapUtils';
import {
  canAddEntryForProjectUser,
  getAddEntryAction,
  openAddEntry
} from '@/services/entries/dataEditorFlow';
import { clearPendingRestore, getPendingRestore } from '@/services/entries/restoreFlow';
import { useDrawerStore } from '@/stores/drawerStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

export default {
  name: 'PageTable',
  components: {
    IonIcon,
    EntriesGrid,
    NavbarSecondary,
    TableEmptyState,
    TableToolbar
  },
  setup() {
    const route = useRoute();
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
    const tableStore = useTableStore();
    const mapStore = useMapStore();
    const drawerStore = useDrawerStore();

    const state = reactive({
      projectStore,
      navigationStore,
      filtersStore,
      tableStore,
      mapStore,
      drawerStore
    });

    const methods = {
      async bootstrap() {
        if (!computedScope.resolvedProjectSlug.value) {
          return;
        }

        navigationStore.setActivePage('table');

        const didLoadProject =
          projectStore.projectSlug === computedScope.resolvedProjectSlug.value
            ? true
            : await projectStore.loadProject(computedScope.resolvedProjectSlug.value);

        if (!didLoadProject) {
          return;
        }

        //coming back from the data editor: rebuild the view the user left behind
        if (await methods.restorePendingView()) {
          return;
        }

        if (navigationStore.currentFormRef) {
          void mapStore.loadLocations({ resetFilters: true });
          await tableStore.loadEntries();
        }
      },
      async restorePendingView() {
        const restoreParams = getPendingRestore({
          restoreQuery: route.query.restore,
          projectStore
        });

        if (!restoreParams) {
          return false;
        }

        const hierarchyNavigator = restoreParams.hierarchyNavigator;
        const activeNavigator = hierarchyNavigator[hierarchyNavigator.length - 1];

        navigationStore.restoreHierarchy({
          hierarchyNavigator,
          currentFormRef: restoreParams.formRef,
          currentFormName: restoreParams.formName || activeNavigator.formName,
          isViewingChildren: restoreParams.isViewingChildren
        });
        //an entry edited from the map drawer comes back to the map it was showing
        navigationStore.setActivePage(restoreParams.activePage === 'map' ? 'map' : 'table');
        mapStore.setPendingMapRestore(restoreParams.mapView || null);
        filtersStore.restore(restoreParams.entriesFilters);

        if (restoreParams.isViewingBranch) {
          navigationStore.enterBranch({
            branchRef: restoreParams.branchRef,
            ownerEntryUuid: restoreParams.branchOwnerUuid,
            ownerEntryTitle: restoreParams.branchOwnerEntryTitle,
            backLink: restoreParams.branchBackLink
          });
          //the saved view is the owner view the branch was opened from
          tableStore.setBranchReturnView({
            filters: restoreParams.entriesFilters,
            page: Number(restoreParams.page) || 1
          });
        }

        await tableStore.loadEntries({
          params: {
            page: Number(restoreParams.page) || 1
          }
        });

        //keep the params when the reload failed, a refresh retries the restore
        if (!tableStore.isRejectedPage) {
          clearPendingRestore();
        }

        return true;
      },
      async handleTitleChange(title) {
        filtersStore.setTitle(title);
        await tableStore.loadEntries({ params: { page: 1 } });
      },
      async handleDateChange({ startDate, endDate }) {
        filtersStore.setDates(startDate, endDate);
        await tableStore.loadEntries({ params: { page: 1 } });
      },
      async handleOrderChange(selectedOrderBy) {
        const nextOrder = getOrderSorting(selectedOrderBy);
        filtersStore.setOrder(selectedOrderBy, nextOrder.sortBy, nextOrder.sortOrder);
        await tableStore.loadEntries({ params: { page: 1 } });
      },
      async handleResetFilters() {
        filtersStore.reset();
        await tableStore.loadEntries({ params: { page: 1 } });
      },
      async handleHierarchyBack() {
        await tableStore.navigateBack();
      },
      async handleBranchBack() {
        await tableStore.navigateBackFromBranch();
      },
      async loadPage(url) {
        if (!url) {
          return;
        }

        await tableStore.loadEntries({ pageUrl: url });
      },
      handlePreviousPage() {
        return methods.loadPage(tableStore.links?.prev);
      },
      handleNextPage() {
        return methods.loadPage(tableStore.links?.next);
      },
      handleAddEntry() {
        openAddEntry();
      },
      handleOpenUpload() {
        drawerStore.open('upload', {
          side: 'left'
        });
      }
    };

    const computedScope = {
      resolvedProjectSlug: computed(() => {
        return route.params.projectSlug || route.query.project || env.projectSlug || '';
      }),
      missingProjectSlug: computed(() => !computedScope.resolvedProjectSlug.value),
      isViewingChildren: computed(() => navigationStore.isViewingChildren),
      isViewingBranch: computed(() => navigationStore.isViewingBranch),
      hierarchyBackFormName: computed(() => {
        const hierarchyNavigator = navigationStore.hierarchyNavigator;
        const parentNavigator = hierarchyNavigator[hierarchyNavigator.length - 2];

        return parentNavigator?.formName || '';
      }),
      branchNavLabel: computed(() => {
        const ownerTitle = navigationStore.currentBranchOwnerEntryTitle || '';
        const branchRef = navigationStore.currentBranchRef;
        const question = branchRef ? projectStore.projectExtra?.inputs?.[branchRef]?.data?.question || '' : '';

        return question ? `${ownerTitle} | ${question}` : ownerTitle;
      }),
      projectErrors: computed(() => {
        return Array.isArray(projectStore.errors) ? projectStore.errors.join(', ') : projectStore.errors;
      }),
      tableErrors: computed(() => {
        return Array.isArray(tableStore.errors) ? tableStore.errors.join(', ') : tableStore.errors;
      }),
      dateBounds: computed(() => {
        return mapUtils.getDateBounds({
          projectStats: projectStore.projectStats,
          currentFormRef: navigationStore.currentFormRef,
          projectCreatedAt: projectStore.projectDefinition?.project?.created_at
        });
      }),
      canAddEntry: computed(() => canAddEntryForProjectUser()),
      addEntryAction: computed(() => getAddEntryAction()),
      hasPagination: computed(() => Boolean(tableStore.pagination)),
      isPreviousPageDisabled: computed(() => !tableStore.links?.prev || tableStore.isFetchingPage),
      isNextPageDisabled: computed(() => !tableStore.links?.next || tableStore.isFetchingPage)
    };

    onMounted(methods.bootstrap);

    watch(computedScope.resolvedProjectSlug, async (nextSlug, previousSlug) => {
      if (nextSlug && nextSlug !== previousSlug) {
        filtersStore.reset();
        await methods.bootstrap();
      }
    });

    const icons = {
      addCircle,
      arrowBack,
      chevronBackCircle,
      chevronForwardCircle,
      cloudUpload
    };

    return {
      state,
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/pages/PageTable.scss" lang="scss"></style>
