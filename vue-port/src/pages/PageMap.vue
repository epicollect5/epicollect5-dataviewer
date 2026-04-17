<template>
  <section class="table-view">
    <div v-if="missingProjectSlug" class="placeholder-view">
      <h1>Project Required</h1>
      <p>Open the Vue port with `?project=your-project-slug` or use `/:projectSlug/data/map`.</p>
    </div>

    <div v-else-if="projectStore.isFetching" class="placeholder-view">
      <h1>Loading project…</h1>
    </div>

    <div v-else-if="projectStore.isRejected" class="placeholder-view">
      <h1>Project Load Failed</h1>
      <p>{{ projectErrors }}</p>
    </div>

    <template v-else>
      <section class="table-toolbar">
        <div class="table-toolbar__primary">
          <FormSwitcher
            :forms="projectStore.forms"
            :selected-form-ref="navigationStore.currentFormRef"
            @change="handleFormChange"
          />
          <button v-if="hasLocationQuestions" class="table-toolbar__ghost" type="button" @click="openFiltersDrawer">Filters</button>
        </div>
      </section>

      <div v-if="!hasLocationQuestions" class="placeholder-view">
        <h1>No map questions in this form</h1>
        <p>This form does not expose any location inputs, so there is nothing to render on the map.</p>
      </div>

      <template v-else>
        <MapProgressBar
          :is-visible="mapStore.progressBarIsVisible || mapStore.isFetchingPage"
          :processed="mapStore.progressBarMarkersProcessed"
          :total="mapStore.progressBarMarkersTotal"
          :percentage="mapStore.progressBarPercentage"
        />

        <div v-if="mapStore.isRejectedPage" class="placeholder-view">
          <h1>Locations Load Failed</h1>
          <p>{{ mapErrors }}</p>
        </div>

        <div v-else-if="!mapStore.isFetchingPage && mapStore.locations.length === 0" class="placeholder-view">
          <h1>No mapped entries</h1>
          <p>The current form has a location question, but the API returned no location features for this selection.</p>
        </div>

        <LeafletMap v-else :markers="mapStore.markers" @marker-click="handleMarkerClick" />
      </template>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import env from '@/config/env';
import { useDrawerStore } from '@/stores/drawerStore';
import FormSwitcher from '@/components/forms/FormSwitcher.vue';
import LeafletMap from '@/components/map/MapLeaflet.vue';
import MapProgressBar from '@/components/map/MapProgressBar.vue';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const route = useRoute();
const drawerStore = useDrawerStore();
const projectStore = useProjectStore();
const navigationStore = useNavigationStore();
const mapStore = useMapStore();

const resolvedProjectSlug = computed(() => {
  return route.params.projectSlug || route.query.project || env.projectSlug || '';
});

const missingProjectSlug = computed(() => !resolvedProjectSlug.value);
const projectErrors = computed(() => {
  return Array.isArray(projectStore.errors) ? projectStore.errors.join(', ') : projectStore.errors;
});
const mapErrors = computed(() => {
  return Array.isArray(mapStore.errors) ? mapStore.errors.join(', ') : mapStore.errors;
});
const locationQuestions = computed(() => mapStore.getLocationQuestions());
const hasLocationQuestions = computed(() => locationQuestions.value.length > 0);

const bootstrap = async () => {
  if (!resolvedProjectSlug.value) {
    return;
  }

  navigationStore.setActivePage('map');

  const didLoadProject =
    projectStore.projectSlug === resolvedProjectSlug.value
      ? true
      : await projectStore.loadProject(resolvedProjectSlug.value);

  if (didLoadProject && navigationStore.currentFormRef) {
    await mapStore.loadLocations({ resetFilters: true });
  }
};

const handleFormChange = async (formRef) => {
  const nextForm = projectStore.forms.find((form) => form.ref === formRef);
  if (!nextForm) {
    return;
  }

  navigationStore.setCurrentForm(nextForm.ref, nextForm.name);
  await mapStore.loadLocations({ resetFilters: true });
};

const handleLocationQuestionChange = async (question) => {
  await mapStore.loadLocations({
    selectedLocationQuestion: question,
    resetFilters: true
  });
};

const handleClusterToggle = (enabled) => {
  mapStore.setClustersEnabled(enabled);
};

const handleDateChange = ({ startDate, endDate }) => {
  mapStore.setDateFilter(startDate, endDate);
};

const handleDateReset = () => {
  mapStore.resetDateFilter();
};

const handleDrawerEvent = async (eventName, value) => {
  if (eventName === 'change-location') {
    await handleLocationQuestionChange(value);
  }

  if (eventName === 'toggle-clusters') {
    handleClusterToggle(value);
  }

  if (eventName === 'update-dates') {
    handleDateChange(value);
  }

  if (eventName === 'reset-dates') {
    handleDateReset();
  }
};

const openFiltersDrawer = () => {
  drawerStore.open('map-filters', {
    side: 'right',
    locationQuestions: locationQuestions.value,
    selectedLocationQuestion: mapStore.selectedLocationQuestion,
    clustersEnabled: mapStore.clustersEnabled,
    startDate: mapStore.startDate,
    endDate: mapStore.endDate,
    minDate: mapStore.minDate,
    maxDate: mapStore.maxDate,
    visibleCount: mapStore.markers.length,
    totalCount: mapStore.locations.length,
    onEvent: handleDrawerEvent
  });
};

const handleMarkerClick = async (marker) => {
  if (!marker?.entryUuid) {
    return;
  }

  drawerStore.open('map-entry', {
    side: 'left'
  });
  await mapStore.loadEntry(marker.entryUuid);
};

onMounted(bootstrap);

watch(resolvedProjectSlug, async (nextSlug, previousSlug) => {
  if (nextSlug && nextSlug !== previousSlug) {
    mapStore.reset();
    drawerStore.close();
    await bootstrap();
  }
});

watch(
  () => [
    mapStore.selectedLocationQuestion,
    mapStore.clustersEnabled,
    mapStore.startDate,
    mapStore.endDate,
    mapStore.markers.length,
    mapStore.locations.length,
    navigationStore.currentFormRef
  ],
  () => {
    if (drawerStore.activeDrawer === 'map-filters') {
      openFiltersDrawer();
    }
  }
);
</script>
