<template>
  <section class="table-toolbar">
    <div class="table-toolbar__primary">
      <FormSwitcher
        :forms="forms"
        :selected-form-ref="selectedFormRef"
        @change="$emit('change-form', $event)"
      />

      <label class="table-toolbar__field table-toolbar__field--search">
        <span>Title</span>
        <input
          :value="filterByTitle"
          type="search"
          placeholder="Filter by title"
          @input="$emit('update:title', $event.target.value)"
        />
      </label>

      <label class="table-toolbar__field">
        <span>From</span>
        <input :value="startDateValue" type="date" @change="emitDateChange('startDate', $event.target.value)" />
      </label>

      <label class="table-toolbar__field">
        <span>To</span>
        <input :value="endDateValue" type="date" @change="emitDateChange('endDate', $event.target.value)" />
      </label>

      <label class="table-toolbar__field">
        <span>Order</span>
        <select :value="selectedOrderBy" @change="$emit('update:order', $event.target.value)">
          <option v-for="option in orderOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="table-toolbar__secondary">
      <button type="button" class="table-toolbar__ghost" @click="$emit('reset-filters')">Reset</button>
      <button type="button" class="table-toolbar__ghost" @click="$emit('open-upload')">Upload</button>

      <div v-if="pagination" class="table-toolbar__pagination">
        <span>Total {{ pagination.total }} · Page {{ pagination.current_page }}/{{ pagination.last_page }}</span>
        <button type="button" :disabled="!links?.prev || isLoading" @click="$emit('previous-page')">
          Prev
        </button>
        <button type="button" :disabled="!links?.next || isLoading" @click="$emit('next-page')">
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import PARAMETERS from '@/config/parameters';
import FormSwitcher from '@/components/forms/FormSwitcher.vue';

const props = defineProps({
  forms: {
    type: Array,
    default: () => []
  },
  selectedFormRef: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  pagination: {
    type: Object,
    default: null
  },
  links: {
    type: Object,
    default: null
  },
  filterByTitle: {
    type: String,
    default: ''
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  selectedOrderBy: {
    type: String,
    default: PARAMETERS.ORDER_BY.NEWEST
  }
});

const emit = defineEmits([
  'change-form',
  'update:title',
  'update:start-date',
  'update:end-date',
  'update:order',
  'reset-filters',
  'open-upload',
  'previous-page',
  'next-page'
]);

const orderOptions = Object.values(PARAMETERS.ORDER_BY);
const startDateValue = computed(() => (props.startDate ? props.startDate.slice(0, 10) : ''));
const endDateValue = computed(() => (props.endDate ? props.endDate.slice(0, 10) : ''));

const emitDateChange = (field, value) => {
  const nextPayload = {
    startDate: field === 'startDate' ? value : startDateValue.value,
    endDate: field === 'endDate' ? value : endDateValue.value
  };

  emit(field === 'startDate' ? 'update:start-date' : 'update:end-date', nextPayload);
};
</script>
