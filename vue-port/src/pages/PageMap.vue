<template>
  <section class="table-view">
    <div v-if="missingProjectSlug" class="placeholder-view">
      <h1>Project Required</h1>
      <p>Open the Vue port with `?project=your-project-slug` or use `/:projectSlug/data/map`.</p>
    </div>

    <div v-else-if="state.projectStore.isFetching" class="placeholder-view">
      <h1>Loading project…</h1>
    </div>

    <div v-else-if="state.projectStore.isRejected" class="placeholder-view">
      <h1>Project Load Failed</h1>
      <p>{{ projectErrors }}</p>
    </div>

    <template v-else>
      <section class="table-toolbar">
        <div class="table-toolbar__primary">
          <button v-if="hasLocationQuestions" class="table-toolbar__ghost" type="button" @click="openFiltersDrawer">Filters</button>
        </div>
      </section>

      <div v-if="!hasLocationQuestions" class="placeholder-view">
        <h1>No map questions in this form</h1>
        <p>This form does not expose any location inputs, so there is nothing to render on the map.</p>
      </div>

      <template v-else>
        <MapProgressBar
          :is-visible="state.mapStore.progressBarIsVisible || state.mapStore.isFetchingPage"
          :processed="state.mapStore.progressBarMarkersProcessed"
          :total="state.mapStore.progressBarMarkersTotal"
          :percentage="state.mapStore.progressBarPercentage"
        />

        <div v-if="state.mapStore.isRejectedPage" class="placeholder-view">
          <h1>Locations Load Failed</h1>
          <p>{{ mapErrors }}</p>
        </div>

        <div v-else-if="!state.mapStore.isFetchingPage && state.mapStore.locations.length === 0" class="placeholder-view">
          <h1>No mapped entries</h1>
          <p>The current form has a location question, but the API returned no location features for this selection.</p>
        </div>

        <LeafletMap v-else :markers="state.mapStore.markers" @marker-click="handleMarkerClick" />
      </template>
    </template>
  </section>
</template>

<script>
import { computed, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import env from '@/config/env';
import { useDrawerStore } from '@/stores/drawerStore';
import LeafletMap from '@/components/map/MapLeaflet.vue';
import MapProgressBar from '@/components/map/MapProgressBar.vue';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

export default {
  name: 'PageMap',
  components: {
    LeafletMap,
    MapProgressBar
  },
  setup() {
    const route = useRoute();
    const drawerStore = useDrawerStore();
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const mapStore = useMapStore();

    const state = reactive({
      drawerStore,
      projectStore,
      navigationStore,
      mapStore
    });

    const methods = {
      async bootstrap() {
        if (!computedState.resolvedProjectSlug.value) {
          return;
        }

        navigationStore.setActivePage('map');

        const didLoadProject =
          projectStore.projectSlug === computedState.resolvedProjectSlug.value
            ? true
            : await projectStore.loadProject(computedState.resolvedProjectSlug.value);

        if (didLoadProject && navigationStore.currentFormRef) {
          await mapStore.loadLocations({ resetFilters: true });
        }
      },
      async handleLocationQuestionChange(question) {
        await mapStore.loadLocations({
          selectedLocationQuestion: question,
          resetFilters: true
        });
      },
      handleClusterToggle(enabled) {
        mapStore.setClustersEnabled(enabled);
      },
      handleDateChange({ startDate, endDate }) {
        mapStore.setDateFilter(startDate, endDate);
      },
      handleDateReset() {
        mapStore.resetDateFilter();
      },
      async handleDrawerEvent(eventName, value) {
        if (eventName === 'change-location') {
          await methods.handleLocationQuestionChange(value);
        }

        if (eventName === 'toggle-clusters') {
          methods.handleClusterToggle(value);
        }

        if (eventName === 'update-dates') {
          methods.handleDateChange(value);
        }

        if (eventName === 'reset-dates') {
          methods.handleDateReset();
        }
      },
      openFiltersDrawer() {
        drawerStore.open('map-filters', {
          side: 'right',
          locationQuestions: computedState.locationQuestions.value,
          selectedLocationQuestion: mapStore.selectedLocationQuestion,
          clustersEnabled: mapStore.clustersEnabled,
          startDate: mapStore.startDate,
          endDate: mapStore.endDate,
          minDate: mapStore.minDate,
          maxDate: mapStore.maxDate,
          visibleCount: mapStore.markers.length,
          totalCount: mapStore.locations.length,
          onEvent: methods.handleDrawerEvent
        });
      },
      async handleMarkerClick(marker) {
        if (!marker?.entryUuid) {
          return;
        }

        drawerStore.open('map-entry', {
          side: 'left'
        });
        await mapStore.loadEntry(marker.entryUuid);
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
      mapErrors: computed(() => {
        return Array.isArray(mapStore.errors) ? mapStore.errors.join(', ') : mapStore.errors;
      }),
      locationQuestions: computed(() => mapStore.getLocationQuestions()),
      hasLocationQuestions: computed(() => computedState.locationQuestions.value.length > 0)
    };

    onMounted(methods.bootstrap);

    watch(computedState.resolvedProjectSlug, async (nextSlug, previousSlug) => {
      if (nextSlug && nextSlug !== previousSlug) {
        mapStore.reset();
        drawerStore.close();
        await methods.bootstrap();
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
          methods.openFiltersDrawer();
        }
      }
    );

    return {
      state,
      ...methods,
      ...computedState
    };
  }
};
</script>
