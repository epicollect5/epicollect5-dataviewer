<template>
  <section class="table-toolbar">
    <div class="table-toolbar__primary">
      <label class="table-toolbar__field table-toolbar__field--search">
        <span>Title</span>
        <input
          :value="props.filterByTitle"
          type="search"
          placeholder="Filter by title"
          @input="handleTitleChange($event.target.value)"
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
        <select :value="props.selectedOrderBy" @change="handleOrderChange($event.target.value)">
          <option v-for="option in orderOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
    </div>

    <div class="table-toolbar__secondary">
      <button type="button" class="table-toolbar__ghost" @click="handleResetFilters">Reset</button>
      <button type="button" class="table-toolbar__ghost" @click="handleOpenUpload">Upload</button>

      <div v-if="props.pagination" class="table-toolbar__pagination">
        <span>Total {{ props.pagination.total }} · Page {{ props.pagination.current_page }}/{{ props.pagination.last_page }}</span>
        <button type="button" :disabled="!props.links?.prev || props.isLoading" @click="handlePreviousPage">
          Prev
        </button>
        <button type="button" :disabled="!props.links?.next || props.isLoading" @click="handleNextPage">
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, reactive } from 'vue';
import PARAMETERS from '@/config/parameters';

export default {
  name: 'ToolbarTable',
  props: {
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
  },
  emits: [
    'update:title',
    'update:start-date',
    'update:end-date',
    'update:order',
    'reset-filters',
    'open-upload',
    'previous-page',
    'next-page'
  ],
  setup(props, { emit }) {
    const state = reactive({
      orderOptions: Object.values(PARAMETERS.ORDER_BY)
    });

    const methods = {
      handleTitleChange(value) {
        emit('update:title', value);
      },
      handleOrderChange(value) {
        emit('update:order', value);
      },
      handleResetFilters() {
        emit('reset-filters');
      },
      handleOpenUpload() {
        emit('open-upload');
      },
      handlePreviousPage() {
        emit('previous-page');
      },
      handleNextPage() {
        emit('next-page');
      },
      emitDateChange(field, value) {
        const nextPayload = {
          startDate: field === 'startDate' ? value : computedState.startDateValue.value,
          endDate: field === 'endDate' ? value : computedState.endDateValue.value
        };

        emit(field === 'startDate' ? 'update:start-date' : 'update:end-date', nextPayload);
      }
    };

    const computedState = {
      startDateValue: computed(() => (props.startDate ? props.startDate.slice(0, 10) : '')),
      endDateValue: computed(() => (props.endDate ? props.endDate.slice(0, 10) : ''))
    };

    return {
      props,
      ...state,
      ...methods,
      ...computedState
    };
  }
};
</script>
