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
      <SecondaryNavbar>
        <template #end>
          <div v-if="state.tableStore.pagination" class="table-toolbar__pagination table-toolbar__pagination--secondary-navbar">
            <span>Total {{ state.tableStore.pagination.total }} · Page {{ state.tableStore.pagination.current_page }}/{{ state.tableStore.pagination.last_page }}</span>
            <button
              type="button"
              class="entries-grid__action-button entries-grid__action-button--view"
              :disabled="!state.tableStore.links?.prev || state.tableStore.isFetchingPage"
              aria-label="Previous page"
              title="Previous page"
              @click="handlePreviousPage"
            >
              <ion-icon :icon="chevronBackCircle" class="entries-grid__action-icon" />
            </button>
            <button
              type="button"
              class="entries-grid__action-button entries-grid__action-button--view"
              :disabled="!state.tableStore.links?.next || state.tableStore.isFetchingPage"
              aria-label="Next page"
              title="Next page"
              @click="handleNextPage"
            >
              <ion-icon :icon="chevronForwardCircle" class="entries-grid__action-icon" />
            </button>
          </div>
        </template>
      </SecondaryNavbar>

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

          <TableEmptyState v-else-if="!state.tableStore.isFetchingPage && state.tableStore.flatRows.length === 0" />

          <EntriesGrid
            v-else
            :headers="state.tableStore.headers"
            :rows="state.tableStore.flatRows"
            :is-loading="state.tableStore.isFetchingPage"
          />
        </div>

        <footer class="table-view__footer">
          <button type="button" class="table-view__upload-button" @click="handleOpenUpload">Upload</button>
        </footer>
      </section>
    </template>
  </section>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { chevronBackCircle, chevronForwardCircle } from 'ionicons/icons';
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import SecondaryNavbar from '@/components/app/SecondaryNavbar.vue';
import env from '@/core/config/env';
import PARAMETERS from '@/core/config/parameters';
import EntriesGrid from '@/components/table/GridEntries.vue';
import TableEmptyState from '@/components/table/StateEmptyTable.vue';
import TableToolbar from '@/components/table/ToolbarTable.vue';
import mapUtils from '@/core/map/mapUtils';
import { useFiltersStore } from '@/stores/filtersStore';
import { useMapStore } from '@/stores/mapStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useUploadStore } from '@/stores/uploadStore';

export default {
  name: 'PageTable',
  components: {
    IonIcon,
    EntriesGrid,
    SecondaryNavbar,
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
    const modalStore = useModalStore();
    const uploadStore = useUploadStore();

    const state = reactive({
      projectStore,
      navigationStore,
      filtersStore,
      tableStore,
      mapStore,
      modalStore,
      uploadStore
    });

    const methods = {
      async bootstrap() {
        if (!computedState.resolvedProjectSlug.value) {
          return;
        }

        navigationStore.setActivePage('table');

        const didLoadProject =
          projectStore.projectSlug === computedState.resolvedProjectSlug.value
            ? true
            : await projectStore.loadProject(computedState.resolvedProjectSlug.value);

        if (didLoadProject && navigationStore.currentFormRef) {
          await tableStore.loadEntries();
          void mapStore.loadLocations({ resetFilters: true });
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
        const orderMap = {
          [PARAMETERS.ORDER_BY.NEWEST]: {
            sortBy: 'created_at',
            sortOrder: 'DESC'
          },
          [PARAMETERS.ORDER_BY.OLDEST]: {
            sortBy: 'created_at',
            sortOrder: 'ASC'
          },
          [PARAMETERS.ORDER_BY.AZ]: {
            sortBy: 'title',
            sortOrder: 'ASC'
          },
          [PARAMETERS.ORDER_BY.ZA]: {
            sortBy: 'title',
            sortOrder: 'DESC'
          }
        };

        const nextOrder = orderMap[selectedOrderBy] || orderMap[PARAMETERS.ORDER_BY.NEWEST];
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
        uploadStore.reset();
        modalStore.open('upload');
      }
    };

    const computedState = {
      resolvedProjectSlug: computed(() => {
        return route.params.projectSlug || route.query.project || env.projectSlug || '';
      }),
      missingProjectSlug: computed(() => !computedState.resolvedProjectSlug.value),
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
      })
    };

    onMounted(methods.bootstrap);

    watch(computedState.resolvedProjectSlug, async (nextSlug, previousSlug) => {
      if (nextSlug && nextSlug !== previousSlug) {
        filtersStore.reset();
        await methods.bootstrap();
      }
    });

    return {
      state,
      chevronBackCircle,
      chevronForwardCircle,
      ...methods,
      ...computedState
    };
  }
};
</script>
<style src="@/theme/pages/PageTable.scss" lang="scss"></style>
