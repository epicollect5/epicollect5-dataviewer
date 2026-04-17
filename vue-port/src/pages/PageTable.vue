<template>
  <section class="table-view">
    <div v-if="missingProjectSlug" class="placeholder-view">
      <h1>Project Required</h1>
      <p>Open the Vue port with `?project=your-project-slug` or use `/:projectSlug/data`.</p>
    </div>

    <div v-else-if="projectStore.isFetching" class="placeholder-view">
      <h1>Loading project…</h1>
    </div>

    <div v-else-if="projectStore.isRejected" class="placeholder-view">
      <h1>Project Load Failed</h1>
      <p>{{ projectErrors }}</p>
    </div>

    <template v-else>
      <TableToolbar
        :is-loading="tableStore.isFetchingPage"
        :pagination="tableStore.pagination"
        :links="tableStore.links"
        :filter-by-title="filtersStore.filterByTitle"
        :start-date="filtersStore.startDate"
        :end-date="filtersStore.endDate"
        :selected-order-by="filtersStore.selectedOrderBy"
        @update:title="handleTitleChange"
        @update:start-date="handleDateChange"
        @update:end-date="handleDateChange"
        @update:order="handleOrderChange"
        @reset-filters="handleResetFilters"
        @open-upload="handleOpenUpload"
        @previous-page="loadPage(tableStore.links?.prev)"
        @next-page="loadPage(tableStore.links?.next)"
      />

      <div v-if="tableStore.isRejectedPage" class="placeholder-view">
        <h1>Entries Load Failed</h1>
        <p>{{ tableErrors }}</p>
      </div>

      <TableEmptyState v-else-if="!tableStore.isFetchingPage && tableStore.flatRows.length === 0" />

      <EntriesGrid
        v-else
        :headers="tableStore.headers"
        :rows="tableStore.flatRows"
        :is-loading="tableStore.isFetchingPage"
      />
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import env from '@/config/env';
import PARAMETERS from '@/config/parameters';
import EntriesGrid from '@/components/table/GridEntries.vue';
import TableEmptyState from '@/components/table/StateEmptyTable.vue';
import TableToolbar from '@/components/table/ToolbarTable.vue';
import { useFiltersStore } from '@/stores/filtersStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useUploadStore } from '@/stores/uploadStore';

const route = useRoute();
const projectStore = useProjectStore();
const navigationStore = useNavigationStore();
const filtersStore = useFiltersStore();
const tableStore = useTableStore();
const modalStore = useModalStore();
const uploadStore = useUploadStore();

let titleDebounceId = null;

const resolvedProjectSlug = computed(() => {
  return route.params.projectSlug || route.query.project || env.projectSlug || '';
});

const missingProjectSlug = computed(() => !resolvedProjectSlug.value);
const projectErrors = computed(() => {
  return Array.isArray(projectStore.errors) ? projectStore.errors.join(', ') : projectStore.errors;
});
const tableErrors = computed(() => {
  return Array.isArray(tableStore.errors) ? tableStore.errors.join(', ') : tableStore.errors;
});

const bootstrap = async () => {
  if (!resolvedProjectSlug.value) {
    return;
  }

  navigationStore.setActivePage('table');

  const didLoadProject =
    projectStore.projectSlug === resolvedProjectSlug.value
      ? true
      : await projectStore.loadProject(resolvedProjectSlug.value);

  if (didLoadProject && navigationStore.currentFormRef) {
    await tableStore.loadEntries();
  }
};

const handleTitleChange = (title) => {
  filtersStore.setTitle(title);
  window.clearTimeout(titleDebounceId);
  titleDebounceId = window.setTimeout(() => {
    tableStore.loadEntries({ params: { page: 1 } });
  }, title.length === 0 ? 0 : 350);
};

const handleDateChange = async ({ startDate, endDate }) => {
  filtersStore.setDates(startDate, endDate);
  await tableStore.loadEntries({ params: { page: 1 } });
};

const handleOrderChange = async (selectedOrderBy) => {
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
};

const handleResetFilters = async () => {
  filtersStore.reset();
  await tableStore.loadEntries({ params: { page: 1 } });
};

const loadPage = async (url) => {
  if (!url) {
    return;
  }

  await tableStore.loadEntries({ pageUrl: url });
};

const handleOpenUpload = () => {
  uploadStore.reset();
  modalStore.open('upload');
};

onMounted(bootstrap);

watch(resolvedProjectSlug, async (nextSlug, previousSlug) => {
  if (nextSlug && nextSlug !== previousSlug) {
    filtersStore.reset();
    await bootstrap();
  }
});
</script>
