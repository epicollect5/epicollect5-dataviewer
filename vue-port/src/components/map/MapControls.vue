<template>
  <section class="map-controls">
    <div class="map-controls__group">
      <label class="map-controls__field">
        <span>Location question</span>
        <select :value="selectedLocationKey" @change="emitLocationChange($event.target.value)">
          <option v-for="question in props.locationQuestions" :key="getLocationKey(question)" :value="getLocationKey(question)">
            {{ question.question }}
          </option>
        </select>
      </label>

      <label class="map-controls__checkbox">
        <input :checked="props.clustersEnabled" type="checkbox" @change="emitClusterToggle($event.target.checked)" />
        <span>Group markers by coordinates</span>
      </label>
    </div>

    <div class="map-controls__group">
      <label class="map-controls__field">
        <span>From</span>
        <input :value="props.startDate" :min="props.minDate" :max="props.maxDate" type="date" @change="emitDateChange('startDate', $event.target.value)" />
      </label>

      <label class="map-controls__field">
        <span>To</span>
        <input :value="props.endDate" :min="props.minDate" :max="props.maxDate" type="date" @change="emitDateChange('endDate', $event.target.value)" />
      </label>

      <button class="table-toolbar__ghost" type="button" @click="resetDates">Reset dates</button>
    </div>

    <p class="map-controls__summary">
      Showing {{ props.visibleCount }} marker{{ props.visibleCount === 1 ? '' : 's' }} from {{ props.totalCount }} location feature{{ props.totalCount === 1 ? '' : 's' }}.
    </p>
  </section>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'MapControls',
  props: {
    locationQuestions: {
      type: Array,
      default: () => []
    },
    selectedLocationQuestion: {
      type: Object,
      default: null
    },
    clustersEnabled: {
      type: Boolean,
      default: true
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
  emits: ['change-location', 'toggle-clusters', 'update-dates', 'reset-dates'],
  setup(props, { emit }) {
    const methods = {
      getLocationKey(question) {
        return [question?.input_ref || '', question?.branch_ref || ''].join('::');
      },
      emitLocationChange(value) {
        const nextQuestion = props.locationQuestions.find((question) => methods.getLocationKey(question) === value);

        if (nextQuestion) {
          emit('change-location', nextQuestion);
        }
      },
      emitClusterToggle(value) {
        emit('toggle-clusters', value);
      },
      emitDateChange(field, value) {
        emit('update-dates', {
          startDate: field === 'startDate' ? value : props.startDate,
          endDate: field === 'endDate' ? value : props.endDate
        });
      },
      resetDates() {
        emit('reset-dates');
      }
    };

    const computedState = {
      selectedLocationKey: computed(() => methods.getLocationKey(props.selectedLocationQuestion))
    };

    return {
      props,
      ...methods,
      ...computedState
    };
  }
};
</script>
