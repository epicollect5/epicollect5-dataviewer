<template>
  <section class="page-map">
    <div v-if="missingProjectSlug" class="placeholder-view">
      <h1>Project Required</h1>
      <p>Open the Vue port with `/project/your-project-slug/data` and switch to the map view from there.</p>
    </div>

    <div v-else-if="state.projectStore.isRejected" class="placeholder-view">
      <h1>Project Load Failed</h1>
      <p>{{ projectErrors }}</p>
    </div>

    <template v-else>
      <NavbarSecondary v-if="hasLocationQuestions">
        <template #start>
          <button
            class="page-map__drawer-button"
            type="button"
            aria-label="Open filters drawer"
            @click="openFiltersDrawer"
          >
            <ion-icon :icon="menu" />
          </button>
        </template>

        <template #end>
          <div v-if="state.mapStore.pagination" class="secondary-navbar-pagination">
            <span>Total {{ entriesTotal }} | Page {{ currentPage }}/{{ lastPage }}</span>
            <button
              type="button"
              class="secondary-navbar-pagination__button"
              :disabled="!state.mapStore.links?.prev || state.mapStore.isFetchingPage"
              aria-label="Previous page"
              title="Previous page"
              @click="handlePreviousPage"
            >
              <ion-icon :icon="chevronBackCircle" class="secondary-navbar-pagination__icon" />
            </button>
            <button
              type="button"
              class="secondary-navbar-pagination__button"
              :disabled="!state.mapStore.links?.next || state.mapStore.isFetchingPage"
              aria-label="Next page"
              title="Next page"
              @click="handleNextPage"
            >
              <ion-icon :icon="chevronForwardCircle" class="secondary-navbar-pagination__icon" />
            </button>
          </div>
        </template>
      </NavbarSecondary>

      <div class="page-map__body">
        <div v-if="!hasLocationQuestions" class="placeholder-view">
          <h1>No map questions in this form</h1>
          <p>This form does not expose any location inputs, so there is nothing to render on the map.</p>
        </div>

        <template v-else>
          <MapProgressBar
            :is-visible="isMapPage && showMapLoader"
            :processed="state.renderProgress.processed"
            :total="state.renderProgress.total"
            :percentage="state.renderProgress.percentage"
          />

          <div v-if="state.mapStore.isRejectedPage" class="placeholder-view">
            <h1>Locations Load Failed</h1>
            <p>{{ mapErrors }}</p>
          </div>

          <div v-else-if="!state.mapStore.isFetchingPage && state.mapStore.locations.length === 0" class="placeholder-view">
            <h1>No mapped entries</h1>
            <p>The current form has a location question, but the API returned no location features for this selection.</p>
          </div>

          <LeafletMap
            v-else-if="shouldRenderMap"
            :ref="setLeafletMap"
            :locations="state.mapStore.visibleLocations"
            :is-active="isMapPage"
            :is-hidden="isMapPage && showMapLoader"
            :start-date="state.mapStore.startDate"
            :end-date="state.mapStore.endDate"
            :total-markers="state.mapStore.locations.length"
            :clusters-enabled="state.mapStore.clustersEnabled"
            :location-cache-key="locationCacheKey"
            :pie-chart-legend="pieChartLegend"
            :possible-answer-map="state.mapStore.possibleAnswerMap"
            @marker-click="handleMarkerClick"
            @render-start="handleMapRenderStart"
            @progress="handleRenderProgress"
            @ready="handleLeafletReady"
          />
        </template>
      </div>
    </template>
  </section>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { chevronBackCircle, chevronForwardCircle, menu } from 'ionicons/icons';
import { computed, nextTick, onMounted, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import NavbarSecondary from '@/components/app/NavbarSecondary.vue';
import env from '@/core/config/env';
import { useDrawerStore } from '@/stores/drawerStore';
import LeafletMap from '@/components/map/MapLeaflet.vue';
import MapProgressBar from '@/components/map/MapProgressBar.vue';
import { buildDistributionChart } from '@/services/map/distributionChart';
import { buildPieChartLegend } from '@/services/map/pieCharts';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const getMultipleChoiceInputRefs = (inputHashMap) => {
  if (!inputHashMap) {
    return [];
  }

  if (Array.isArray(inputHashMap.order)) {
    return inputHashMap.order;
  }

  return Object.keys(inputHashMap).filter((inputRef) => inputRef !== 'order');
};

export default {
  name: 'PageMap',
  components: {
    IonIcon,
    NavbarSecondary,
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
      mapStore,
      leafletMap: null,
      isMapViewReady: false,
      isRevealingMap: false,
      renderProgress: {
        isVisible: false,
        processed: 0,
        total: 0,
        percentage: 0
      }
    });

    const methods = {
      waitForPaint() {
        return new Promise((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(resolve);
          });
        });
      },
      setLeafletMap(instance) {
        state.leafletMap = instance;
      },
      resetMapViewState() {
        state.isMapViewReady = false;
        state.isRevealingMap = false;
        state.renderProgress.isVisible = false;
        state.renderProgress.processed = 0;
        state.renderProgress.total = 0;
        state.renderProgress.percentage = 0;
      },
      async bootstrap() {
        if (!computedScope.resolvedProjectSlug.value) {
          return;
        }

        const didLoadProject =
          projectStore.projectSlug === computedScope.resolvedProjectSlug.value
            ? true
            : await projectStore.loadProject(computedScope.resolvedProjectSlug.value);

        if (didLoadProject && navigationStore.currentFormRef) {
          await mapStore.loadLocations({ resetFilters: true });
        }
      },
      async handleLocationQuestionChange(question) {
        methods.resetMapViewState();
        navigationStore.setBusy(true);
        await mapStore.loadLocations({
          selectedLocationQuestion: question,
          resetFilters: true
        });
        mapStore.resetDistributionQuestion();
      },
      handleDistributionQuestionChange(question) {
        mapStore.setDistributionQuestion(question);
      },
      handleDistributionReset() {
        mapStore.resetDistributionQuestion();
      },
      getDistributionChart() {
        return buildDistributionChart({
          entries: mapStore.visibleLocations,
          legend: computedScope.pieChartLegend.value,
          selectedDistributionQuestion: mapStore.selectedDistributionQuestion,
          possibleAnswerMap: mapStore.possibleAnswerMap
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
      async loadPage(url) {
        if (!url) {
          return;
        }

        methods.resetMapViewState();
        await mapStore.loadLocations({ pageUrl: url });
      },
      handlePreviousPage() {
        return methods.loadPage(mapStore.links?.prev);
      },
      handleNextPage() {
        return methods.loadPage(mapStore.links?.next);
      },
      async handleDrawerEvent(eventName, value) {
        if (eventName === 'change-location') {
          await methods.handleLocationQuestionChange(value);
        }

        if (eventName === 'change-distribution') {
          methods.handleDistributionQuestionChange(value);
        }

        if (eventName === 'reset-distribution') {
          methods.handleDistributionReset();
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
          side: 'left',
          locationQuestions: computedScope.locationQuestions.value,
          distributionQuestions: computedScope.distributionQuestions.value,
          selectedDistributionQuestion: mapStore.selectedDistributionQuestion,
          distributionChart: methods.getDistributionChart(),
          selectedLocationQuestion: mapStore.selectedLocationQuestion,
          startDate: mapStore.startDate,
          endDate: mapStore.endDate,
          minDate: mapStore.minDate,
          maxDate: mapStore.maxDate,
          visibleCount: mapStore.visibleLocations.length,
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
        state.leafletMap?.setActiveMarkerPopupTitle?.(mapStore.selectedEntryTitle);
      },
      closeEntryPopup() {
        state.leafletMap?.closeActivePopup?.();
      },
      handleRenderProgress(progress) {
        state.renderProgress.isVisible = progress.isVisible;
        state.renderProgress.processed = progress.processed;
        state.renderProgress.total = progress.total;
        state.renderProgress.percentage = progress.percentage;
      },
      handleMapRenderStart() {
        state.isMapViewReady = false;
        state.isRevealingMap = false;

        if (navigationStore.activePage === 'map') {
          navigationStore.setBusy(true);
        }
      },
      async handleLeafletReady() {
        if (state.isMapViewReady || state.isRevealingMap) {
          return;
        }

        state.isRevealingMap = true;
        state.leafletMap?.invalidateMapSize?.();
        state.leafletMap?.applyInitialFit?.();
        await methods.waitForPaint();
        state.renderProgress.isVisible = false;
        state.isMapViewReady = true;
        state.isRevealingMap = false;
        navigationStore.setFirstMapLoad(false);
        navigationStore.setBusy(false);
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
      mapErrors: computed(() => {
        return Array.isArray(mapStore.errors) ? mapStore.errors.join(', ') : mapStore.errors;
      }),
      locationQuestions: computed(() => mapStore.getLocationQuestions()),
      hasLocationQuestions: computed(() => computedScope.locationQuestions.value.length > 0),
      entriesTotal: computed(() => mapStore.pagination?.total ?? mapStore.locations.length),
      currentPage: computed(() => mapStore.pagination?.current_page ?? 1),
      lastPage: computed(() => mapStore.pagination?.last_page ?? 1),
      isMapPage: computed(() => navigationStore.activePage === 'map'),
      distributionQuestions: computed(() => {
        const currentForm = projectStore.projectExtra?.forms?.[navigationStore.currentFormRef];
        const multipleChoiceInputs = currentForm?.lists?.multiple_choice_inputs;
        const selectedBranchRef = mapStore.selectedLocationQuestion?.branch_ref || '';
        let inputHashMap = multipleChoiceInputs?.form || {};

        if (selectedBranchRef) {
          inputHashMap = multipleChoiceInputs?.branch?.[selectedBranchRef] || {};
        }

        return getMultipleChoiceInputRefs(inputHashMap)
          .map((inputRef) => ({
            inputRef,
            question: projectStore.projectExtra?.inputs?.[inputRef]?.data?.question || inputRef,
            possibleAnswersHashMap: inputHashMap?.[inputRef]?.possible_answers || {}
          }))
          .filter((question) => Object.keys(question.possibleAnswersHashMap).length > 0);
      }),
      pieChartLegend: computed(() => {
        const answers = mapStore.selectedDistributionQuestion?.possibleAnswersHashMap || {};

        return buildPieChartLegend(answers, mapStore.possibleAnswerMap);
      }),
      locationCacheKey: computed(() => {
        const question = mapStore.selectedLocationQuestion;
        const questionKey = question ? `${question.branch_ref || ''}:${question.input_ref || ''}` : 'default';
        const distributionKey = mapStore.selectedDistributionQuestion?.inputRef || 'none';
        const pageKey = mapStore.pagination?.current_page || 1;

        return `${projectStore.projectSlug || 'project'}|${navigationStore.currentFormRef || 'form'}|${questionKey}|${distributionKey}|${pageKey}`;
      }),
      shouldRenderMap: computed(() => {
        return computedScope.hasLocationQuestions.value && !mapStore.isRejectedPage && mapStore.locations.length > 0;
      }),
      showMapLoader: computed(() => {
        if (!computedScope.hasLocationQuestions.value || mapStore.isRejectedPage) {
          return false;
        }

        if (!mapStore.isFetchingPage && mapStore.hasLoadedInitialPage && mapStore.locations.length === 0) {
          return false;
        }

        return mapStore.isFetchingPage || state.renderProgress.isVisible || !state.isMapViewReady || state.isRevealingMap;
      })
    };

    onMounted(methods.bootstrap);

    watch(computedScope.resolvedProjectSlug, async (nextSlug, previousSlug) => {
      if (nextSlug && nextSlug !== previousSlug) {
        mapStore.reset();
        drawerStore.close();
        methods.resetMapViewState();
        await methods.bootstrap();
      }
    });

    watch(
      () => [mapStore.isFetchingPage, mapStore.locations.length],
      ([isFetchingPage, locationsLength], [previousFetchingPage, previousLocationsLength] = []) => {
        const finishedFetch = previousFetchingPage && !isFetchingPage;
        const changedPayload = locationsLength !== previousLocationsLength;

        if (finishedFetch || changedPayload) {
          methods.resetMapViewState();
        }
      }
    );

    watch(
      () => [
        navigationStore.activePage,
        computedScope.showMapLoader.value,
        mapStore.isRejectedPage,
        mapStore.hasLoadedInitialPage,
        mapStore.locations.length,
        computedScope.hasLocationQuestions.value
      ],
      ([activePage, nextShowLoader, isRejectedPage, hasLoadedInitialPage, locationsLength, nextHasLocationQuestions]) => {
        if (activePage !== 'map') {
          navigationStore.setBusy(false);
          return;
        }

        if (!nextHasLocationQuestions || isRejectedPage || (hasLoadedInitialPage && locationsLength === 0)) {
          navigationStore.setBusy(false);
          return;
        }

        navigationStore.setBusy(nextShowLoader);
      },
      {
        immediate: true
      }
    );

    watch(
      () => navigationStore.activePage,
      async (activePage, previousPage) => {
        if (activePage !== 'map' || previousPage === 'map') {
          return;
        }

        await nextTick();
        state.leafletMap?.invalidateMapSize?.();
        state.leafletMap?.applyInitialFit?.();
      }
    );

    watch(
      () => [
        mapStore.selectedLocationQuestion,
        mapStore.clustersEnabled,
        mapStore.startDate,
        mapStore.endDate,
        mapStore.selectedDistributionQuestion,
        mapStore.visibleLocations.length,
        mapStore.locations.length,
        navigationStore.currentFormRef
      ],
      () => {
        if (drawerStore.activeDrawer === 'map-filters') {
          methods.openFiltersDrawer();
        }
      }
    );

    watch(
      () => drawerStore.activeDrawer,
      (activeDrawer, previousDrawer) => {
        if (previousDrawer === 'map-entry' && activeDrawer !== 'map-entry') {
          methods.closeEntryPopup();
        }
      }
    );

    return {
      state,
      ...methods,
      ...computedScope,
      chevronBackCircle,
      chevronForwardCircle,
      menu
    };
  }
};
</script>
<style src="@/theme/pages/PageMap.scss" lang="scss"></style>
