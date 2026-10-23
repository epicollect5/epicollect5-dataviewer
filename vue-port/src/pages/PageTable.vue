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
        <template #end>
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
import { chevronBackCircle, chevronForwardCircle, cloudUpload } from 'ionicons/icons';
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavbarSecondary from '@/components/main/NavbarSecondary.vue';
import env from '@/core/config/env';
import EntriesGrid from '@/components/table/GridEntries.vue';
import TableEmptyState from '@/components/table/StateEmptyTable.vue';
import TableToolbar from '@/components/table/ToolbarTable.vue';
import { getOrderSorting } from '@/core/entries/orderSorting';
import mapUtils from '@/core/map/mapUtils';
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

        if (didLoadProject && navigationStore.currentFormRef) {
          void mapStore.loadLocations({ resetFilters: true });
          await tableStore.loadEntries();
        }
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
