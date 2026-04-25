<template>
  <div class="drawer-map">
    <div class="drawer-map__sections">
      <ion-card class="drawer-map__card">
        <ion-card-header class="drawer-map__card-header" color="light">
          <ion-card-title>Location</ion-card-title>
        </ion-card-header>
        <ion-card-content class="drawer-map__card-content">
          <label class="drawer-map__field">
            <select :value="selectedLocationKey" @change="emitLocationChange($event.target.value)">
              <option v-for="question in props.locationQuestions" :key="getLocationKey(question)" :value="getLocationKey(question)">
                {{ question.question }}
              </option>
            </select>
          </label>
        </ion-card-content>
      </ion-card>

      <ion-card class="drawer-map__card">
        <ion-card-header class="drawer-map__card-header" color="light">
          <div class="drawer-map__card-heading">
            <ion-card-title>Timeline</ion-card-title>
            <button class="drawer-map__reset-button" type="button" :disabled="isTimelineResetDisabled" @click="resetDates">
              Reset
            </button>
          </div>
        </ion-card-header>
        <ion-card-content class="drawer-map__card-content">
          <div class="drawer-map__timeline">
            <p class="drawer-map__timeline-labels">
              <span>{{ timelineStartLabel }}</span>
              <span>to</span>
              <span>{{ timelineEndLabel }}</span>
            </p>

            <ion-range
              class="drawer-map__timeline-range"
              :min="0"
              :max="maxTimelineIndex"
              :step="1"
              :snaps="true"
              :ticks="false"
              :dual-knobs="true"
              :disabled="isTimelineDisabled"
              :value="timelineValue"
              @ionInput="handleTimelineInput($event)"
              @ionChange="handleTimelineChange($event)"
            />
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card class="drawer-map__card">
        <ion-card-header class="drawer-map__card-header" color="light">
          <div class="drawer-map__card-heading">
            <ion-card-title>Distribution</ion-card-title>
            <button class="drawer-map__reset-button" type="button" disabled>
              Reset
            </button>
          </div>
        </ion-card-header>
        <ion-card-content class="drawer-map__card-content">
          <label class="drawer-map__field">
            <select :value="selectedDistributionKey" disabled>
              <option value="">{{ distributionPlaceholder }}</option>
              <option v-for="question in props.distributionQuestions" :key="question.inputRef" :value="question.inputRef">
                {{ question.question }}
              </option>
            </select>
          </label>
        </ion-card-content>
      </ion-card>
    </div>

    <p class="drawer-map__summary">
      Showing {{ props.visibleCount }} marker{{ props.visibleCount === 1 ? '' : 's' }} from {{ props.totalCount }} location feature{{ props.totalCount === 1 ? '' : 's' }}.
    </p>
  </div>
</template>

<script>
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonRange
} from '@ionic/vue';
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import mapUtils from '@/core/map/mapUtils';

const TIMELINE_DEBOUNCE_MS = 1000;

const normalizeRangeValue = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      lower: 0,
      upper: 0
    };
  }

  const lower = Number(value.lower);
  const upper = Number(value.upper);

  return {
    lower: Number.isFinite(lower) ? lower : 0,
    upper: Number.isFinite(upper) ? upper : 0
  };
};

const formatTimelineLabel = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  }).format(value);
};

export default {
  name: 'DrawerMap',
  props: {
    locationQuestions: {
      type: Array,
      default: () => []
    },
    selectedLocationQuestion: {
      type: Object,
      default: null
    },
    distributionQuestions: {
      type: Array,
      default: () => []
    },
    selectedDistributionQuestion: {
      type: Object,
      default: null
    },
    startDate: {
      type: String,
      default: ''
    },
    endDate: {
      type: String,
      default: ''
    },
    minDate: {
      type: String,
      default: ''
    },
    maxDate: {
      type: String,
      default: ''
    },
    visibleCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    }
  },
  emits: ['change-location', 'update-dates', 'reset-dates'],
  components: {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonRange
  },
  setup(props, { emit }) {
    const state = reactive({
      debounceTimer: null,
      suppressTimelineEvents: false,
      timelineValue: {
        lower: 0,
        upper: 0
      }
    });

    const methods = {
      getLocationKey(question) {
        return [question?.input_ref || '', question?.branch_ref || ''].join('::');
      },
      getTimelineValueFromProps() {
        const datesRange = computedState.datesRange.value;

        if (datesRange.length === 0) {
          return {
            lower: 0,
            upper: 0
          };
        }

        const fallbackUpper = datesRange.length - 1;
        const lowerIndex = Math.max(0, datesRange.findIndex((date) => mapUtils.toDateInput(date) === props.startDate));
        const upperIndex = datesRange.findIndex((date) => mapUtils.toDateInput(date) === props.endDate);

        return {
          lower: lowerIndex,
          upper: upperIndex >= 0 ? upperIndex : fallbackUpper
        };
      },
      syncTimelineValue() {
        state.suppressTimelineEvents = true;
        state.timelineValue = methods.getTimelineValueFromProps();
        window.requestAnimationFrame(() => {
          state.suppressTimelineEvents = false;
        });
      },
      emitLocationChange(value) {
        const nextQuestion = props.locationQuestions.find((question) => methods.getLocationKey(question) === value);

        if (nextQuestion) {
          emit('change-location', nextQuestion);
        }
      },
      emitTimelineDates(nextValue) {
        const datesRange = computedState.datesRange.value;

        if (datesRange.length === 0) {
          emit('update-dates', {
            startDate: '',
            endDate: ''
          });
          return;
        }

        const lowerIndex = Math.max(0, Math.min(nextValue.lower, datesRange.length - 1));
        const upperIndex = Math.max(lowerIndex, Math.min(nextValue.upper, datesRange.length - 1));

        emit('update-dates', {
          startDate: mapUtils.toDateInput(datesRange[lowerIndex]),
          endDate: mapUtils.toDateInput(datesRange[upperIndex])
        });
      },
      scheduleTimelineEmit(nextValue) {
        window.clearTimeout(state.debounceTimer);
        state.debounceTimer = window.setTimeout(() => {
          methods.emitTimelineDates(nextValue);
        }, TIMELINE_DEBOUNCE_MS);
      },
      handleTimelineInput(event) {
        if (state.suppressTimelineEvents) {
          return;
        }

        const nextValue = normalizeRangeValue(event.detail.value);
        state.timelineValue = nextValue;
        methods.scheduleTimelineEmit(nextValue);
      },
      handleTimelineChange(event) {
        if (state.suppressTimelineEvents) {
          return;
        }

        const nextValue = normalizeRangeValue(event.detail.value);
        state.timelineValue = nextValue;
        window.clearTimeout(state.debounceTimer);
        methods.emitTimelineDates(nextValue);
      },
      resetDates() {
        window.clearTimeout(state.debounceTimer);
        emit('reset-dates');
      }
    };

    const computedState = {
      selectedLocationKey: computed(() => methods.getLocationKey(props.selectedLocationQuestion)),
      selectedDistributionKey: computed(() => props.selectedDistributionQuestion?.inputRef || ''),
      distributionPlaceholder: computed(() => {
        if (props.distributionQuestions.length === 0) {
          return 'No distribution questions';
        }

        return props.selectedDistributionQuestion?.question || 'Select question';
      }),
      datesRange: computed(() => mapUtils.getDatesRange(props.minDate, props.maxDate)),
      maxTimelineIndex: computed(() => Math.max(0, computedState.datesRange.value.length - 1)),
      isTimelineDisabled: computed(() => computedState.datesRange.value.length <= 1),
      isTimelineResetDisabled: computed(() => {
        if (computedState.datesRange.value.length === 0) {
          return true;
        }

        return !props.startDate && !props.endDate;
      }),
      timelineStartLabel: computed(() => {
        const datesRange = computedState.datesRange.value;
        const lower = state.timelineValue.lower;
        return formatTimelineLabel(datesRange[lower]);
      }),
      timelineEndLabel: computed(() => {
        const datesRange = computedState.datesRange.value;
        const upper = state.timelineValue.upper;
        return formatTimelineLabel(datesRange[upper]);
      }),
      timelineValue: computed(() => state.timelineValue)
    };

    watch(
      () => [props.minDate, props.maxDate, props.startDate, props.endDate],
      () => {
        methods.syncTimelineValue();
      },
      {
        immediate: true
      }
    );

    onBeforeUnmount(() => {
      window.clearTimeout(state.debounceTimer);
    });

    return {
      props,
      state,
      ...methods,
      ...computedState
    };
  }
};
</script>
<style src="@/theme/map/DrawerMap.scss" lang="scss"></style>
