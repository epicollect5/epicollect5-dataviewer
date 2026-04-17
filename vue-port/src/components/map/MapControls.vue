<template>
  <section class="map-controls">
    <div class="map-controls__group">
      <label class="map-controls__field">
        <span>Location question</span>
        <select :value="selectedLocationKey" @change="emitLocationChange($event.target.value)">
          <option v-for="question in locationQuestions" :key="getLocationKey(question)" :value="getLocationKey(question)">
            {{ question.question }}
          </option>
        </select>
      </label>

      <label class="map-controls__checkbox">
        <input :checked="clustersEnabled" type="checkbox" @change="$emit('toggle-clusters', $event.target.checked)" />
        <span>Group markers by coordinates</span>
      </label>
    </div>

    <div class="map-controls__group">
      <label class="map-controls__field">
        <span>From</span>
        <input :value="startDate" :min="minDate" :max="maxDate" type="date" @change="emitDateChange('startDate', $event.target.value)" />
      </label>

      <label class="map-controls__field">
        <span>To</span>
        <input :value="endDate" :min="minDate" :max="maxDate" type="date" @change="emitDateChange('endDate', $event.target.value)" />
      </label>

      <button class="table-toolbar__ghost" type="button" @click="$emit('reset-dates')">Reset dates</button>
    </div>

    <p class="map-controls__summary">
      Showing {{ visibleCount }} marker{{ visibleCount === 1 ? '' : 's' }} from {{ totalCount }} location feature{{ totalCount === 1 ? '' : 's' }}.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
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
});

const emit = defineEmits(['change-location', 'toggle-clusters', 'update-dates', 'reset-dates']);

const getLocationKey = (question) => {
  return [question?.input_ref || '', question?.branch_ref || ''].join('::');
};

const selectedLocationKey = computed(() => getLocationKey(props.selectedLocationQuestion));

const emitLocationChange = (value) => {
  const nextQuestion = props.locationQuestions.find((question) => getLocationKey(question) === value);

  if (nextQuestion) {
    emit('change-location', nextQuestion);
  }
};

const emitDateChange = (field, value) => {
  emit('update-dates', {
    startDate: field === 'startDate' ? value : props.startDate,
    endDate: field === 'endDate' ? value : props.endDate
  });
};
</script>
