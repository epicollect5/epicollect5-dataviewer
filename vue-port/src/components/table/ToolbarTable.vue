<template>
  <section class="table-toolbar">
    <div class="table-toolbar__primary">
      <ion-searchbar
        :value="props.filterByTitle"
        class="table-toolbar__searchbar"
        placeholder="Filter by title"
        :debounce="350"
        show-clear-button="focus"
        @ionInput="handleTitleChange($event.detail.value || '')"
      />

      <div class="table-toolbar__field table-toolbar__field--date">
        <span class="table-toolbar__date-prefix">From:</span>
        <ion-modal :keep-contents-mounted="true">
          <ion-datetime
            :id="state.startDatetimeId"
            :value="resolvedStartDate"
            :min="props.minDate"
            :max="resolvedEndDate"
            presentation="date"
            :show-default-buttons="true"
            @ionChange="handleDateTimeChange('startDate', $event)"
          />
        </ion-modal>
        <ion-datetime-button
          v-if="state.datetimeButtonsReady"
          :datetime="state.startDatetimeId"
          :disabled="!hasDateBounds"
          class="table-toolbar__datetime-button"
        />
      </div>

      <div class="table-toolbar__field table-toolbar__field--date">
        <span class="table-toolbar__date-prefix">To:</span>
        <ion-modal :keep-contents-mounted="true">
          <ion-datetime
            :id="state.endDatetimeId"
            :value="resolvedEndDate"
            :min="resolvedStartDate"
            :max="props.maxDate"
            presentation="date"
            :show-default-buttons="true"
            @ionChange="handleDateTimeChange('endDate', $event)"
          />
        </ion-modal>
        <ion-datetime-button
          v-if="state.datetimeButtonsReady"
          :datetime="state.endDatetimeId"
          :disabled="!hasDateBounds"
          class="table-toolbar__datetime-button"
        />
      </div>

      <div class="table-toolbar__controls">
        <label class="table-toolbar__field table-toolbar__field--sort">
          <select :value="props.selectedOrderBy" @change="handleOrderChange($event.target.value)">
            <option v-for="option in state.orderOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>

        <button
          type="button"
          class="table-toolbar__icon-button"
          aria-label="Reset filters"
          title="Reset filters"
          @click="handleResetFilters"
        >
          <ion-icon :icon="close" />
        </button>
      </div>
    </div>

    <div class="table-toolbar__secondary">
      <button type="button" class="table-toolbar__ghost" @click="handleOpenUpload">Upload</button>

      <div v-if="props.pagination" class="table-toolbar__pagination">
        <span>Total {{ props.pagination.total }} · Page {{ props.pagination.current_page }}/{{ props.pagination.last_page }}</span>
        <button
          type="button"
          class="entries-grid__action-button entries-grid__action-button--view"
          :disabled="!props.links?.prev || props.isLoading"
          aria-label="Previous page"
          title="Previous page"
          @click="handlePreviousPage"
        >
          <ion-icon :icon="chevronBackCircle" class="entries-grid__action-icon" />
        </button>
        <button
          type="button"
          class="entries-grid__action-button entries-grid__action-button--view"
          :disabled="!props.links?.next || props.isLoading"
          aria-label="Next page"
          title="Next page"
          @click="handleNextPage"
        >
          <ion-icon :icon="chevronForwardCircle" class="entries-grid__action-icon" />
        </button>
      </div>
    </div>
  </section>
</template>

<script>
import { IonDatetime, IonDatetimeButton, IonIcon, IonModal, IonSearchbar } from '@ionic/vue';
import { chevronBackCircle, chevronForwardCircle, close } from 'ionicons/icons';
import { computed, onMounted, reactive } from 'vue';
import PARAMETERS from '@/core/config/parameters';

export default {
  name: 'ToolbarTable',
  components: {
    IonDatetime,
    IonDatetimeButton,
    IonIcon,
    IonModal,
    IonSearchbar
  },
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
    minDate: {
      type: String,
      default: ''
    },
    maxDate: {
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
      orderOptions: Object.values(PARAMETERS.ORDER_BY),
      startDatetimeId: 'table-toolbar-start-date',
      endDatetimeId: 'table-toolbar-end-date',
      datetimeButtonsReady: false
    });

    const computedState = {
      hasDateBounds: computed(() => Boolean(props.minDate && props.maxDate)),
      resolvedStartDate: computed(() => {
        return (props.startDate ? props.startDate.slice(0, 10) : '') || props.minDate || '';
      }),
      resolvedEndDate: computed(() => {
        return (props.endDate ? props.endDate.slice(0, 10) : '') || props.maxDate || '';
      })
    };

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
          startDate: field === 'startDate' ? value : computedState.resolvedStartDate.value,
          endDate: field === 'endDate' ? value : computedState.resolvedEndDate.value
        };

        emit(field === 'startDate' ? 'update:start-date' : 'update:end-date', nextPayload);
      },
      handleDateTimeChange(field, event) {
        const detailValue = Array.isArray(event.detail?.value) ? event.detail.value[0] : event.detail?.value;

        if (!detailValue) {
          return;
        }

        methods.emitDateChange(field, detailValue.slice(0, 10));
      }
    };

    onMounted(() => {
      window.requestAnimationFrame(() => {
        state.datetimeButtonsReady = true;
      });
    });

    return {
      props,
      state,
      chevronBackCircle,
      chevronForwardCircle,
      close,
      ...methods,
      ...computedState
    };
  }
};
</script>
<style src="@/theme/table/ToolbarTable.scss" lang="scss"></style>
