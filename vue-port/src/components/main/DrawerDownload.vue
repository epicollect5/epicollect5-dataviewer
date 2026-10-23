<template>
  <div class="drawer-download">
    <ion-card class="drawer-download__card">
      <ion-card-header class="drawer-download__card-header" color="light">
        <ion-card-title>Mapping</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-download__card-content">
        <Dropdown
          :model-value="state.selectedMappingIndex"
          :options="mappingOptions"
          @change="handleMappingChange"
        />
      </ion-card-content>
    </ion-card>

    <ion-card class="drawer-download__card">
      <ion-card-header class="drawer-download__card-header" color="light">
        <ion-card-title>Timeframe</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-download__card-content">
        <Dropdown
          :model-value="state.selectedTimeframe"
          :options="timeframeOptions"
          @change="handleTimeframeChange"
        />
      </ion-card-content>
    </ion-card>

    <ion-card class="drawer-download__card">
      <ion-card-header class="drawer-download__card-header" color="light">
        <ion-card-title>Format</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-download__card-content">
        <div class="drawer-download__format-options">
          <button
            type="button"
            class="drawer-download__format-btn"
            :class="jsonFormatClasses"
            @click="selectJsonFormat"
          >
            JSON
          </button>
          <button
            type="button"
            class="drawer-download__format-btn"
            :class="csvFormatClasses"
            @click="selectCsvFormat"
          >
            CSV
          </button>
        </div>
      </ion-card-content>
    </ion-card>

    <div class="drawer-download__footer">
      <ion-button expand="block" color="secondary" @click="handleDownload">
        <ion-icon slot="start" :icon="archive" />
        Download
      </ion-button>
    </div>

    <ion-modal
      :is-open="state.showPickDatesModal"
      @didDismiss="closePickDatesModal"
    >
      <ion-header>
        <ion-toolbar>
          <ion-title>Pick dates</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closePickDatesModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="drawer-download__dates-grid">
          <div class="drawer-download__dates-column">
            <p class="drawer-download__dates-label">Start date</p>
            <ion-datetime
              color="secondary"
              :value="state.selectedStartDate"
              :min="formattedMinDate"
              :max="state.selectedEndDate"
              presentation="date"
              @ionChange="handleStartDateChange"
            />
          </div>
          <div class="drawer-download__dates-column">
            <p class="drawer-download__dates-label">End date</p>
            <ion-datetime
              color="secondary"
              :value="state.selectedEndDate"
              :min="state.selectedStartDate"
              :max="formattedMaxDate"
              presentation="date"
              @ionChange="handleEndDateChange"
            />
          </div>
        </div>
        <div class="drawer-download__dates-apply">
          <ion-button expand="block" color="secondary" @click="applyCustomDates">Apply</ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { archive } from 'ionicons/icons';
import { computed, onMounted, reactive } from 'vue';
import Dropdown from '@/components/global/Dropdown.vue';
import PARAMETERS from '@/core/config/parameters';
import mapUtils from '@/core/map/mapUtils';

export default {
  name: 'DrawerDownload',
  components: {
    Dropdown,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonDatetime,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar
  },
  props: {
    projectMapping: {
      type: [Array, Object],
      default: () => []
    },
    projectSlug: {
      type: String,
      default: ''
    },
    currentFormRef: {
      type: String,
      default: ''
    },
    firstEntryDate: {
      type: String,
      default: ''
    },
    lastEntryDate: {
      type: String,
      default: ''
    },
    defaultMapping: {
      type: Object,
      default: null
    }
  },
  emits: ['download'],
  setup(props, { emit }) {
    const state = reactive({
      selectedMappingIndex: '',
      selectedTimeframe: PARAMETERS.TIMEFRAME.LIFETIME,
      selectedFormat: PARAMETERS.FORMAT_CSV,
      showPickDatesModal: false,
      selectedStartDate: '',
      selectedEndDate: ''
    });

    const methods = {
      handleMappingChange(value) {
        state.selectedMappingIndex = value;
      },
      handleTimeframeChange(value) {
        state.selectedTimeframe = value;

        if (value === PARAMETERS.TIMEFRAME.CUSTOM) {
          state.showPickDatesModal = true;
        }
      },
      handleFormatChange(value) {
        state.selectedFormat = value;
      },
      selectJsonFormat() {
        methods.handleFormatChange(PARAMETERS.FORMAT_JSON);
      },
      selectCsvFormat() {
        methods.handleFormatChange(PARAMETERS.FORMAT_CSV);
      },
      handleStartDateChange(event) {
        const detailValue = Array.isArray(event.detail?.value) ? event.detail.value[0] : event.detail?.value;

        if (!detailValue) {
          return;
        }

        state.selectedStartDate = detailValue.slice(0, 10);
      },
      handleEndDateChange(event) {
        const detailValue = Array.isArray(event.detail?.value) ? event.detail.value[0] : event.detail?.value;

        if (!detailValue) {
          return;
        }

        state.selectedEndDate = detailValue.slice(0, 10);
      },
      applyCustomDates() {
        state.showPickDatesModal = false;
      },
      closePickDatesModal() {
        state.showPickDatesModal = false;
      },
      getSelectedMapping() {
        return computedScope.normalizedMapping.value.find((mapping) => mapping.map_index === state.selectedMappingIndex) || null;
      },
      handleDownload() {
        const selectedMapping = methods.getSelectedMapping();

        emit('download', {
          map_index: selectedMapping?.map_index,
          format: state.selectedFormat,
          activeTimeframe: state.selectedTimeframe,
          selectedStartDate: state.selectedTimeframe === PARAMETERS.TIMEFRAME.CUSTOM ? state.selectedStartDate : null,
          selectedEndDate: state.selectedTimeframe === PARAMETERS.TIMEFRAME.CUSTOM ? state.selectedEndDate : null
        });
      }
    };

    const computedScope = {
      normalizedMapping: computed(() => {
        return Array.isArray(props.projectMapping)
          ? props.projectMapping
          : Object.values(props.projectMapping || {});
      }),
      mappingOptions: computed(() => {
        return computedScope.normalizedMapping.value.map((mapping) => ({
          label: mapping.name,
          value: mapping.map_index
        }));
      }),
      timeframeOptions: computed(() => {
        return Object.values(PARAMETERS.TIMEFRAME).map((value) => ({
          label: value,
          value
        }));
      }),
      jsonFormatClasses: computed(() => ({
        'drawer-download__format-btn--active': state.selectedFormat === PARAMETERS.FORMAT_JSON
      })),
      csvFormatClasses: computed(() => ({
        'drawer-download__format-btn--active': state.selectedFormat === PARAMETERS.FORMAT_CSV
      })),
      formattedMinDate: computed(() => mapUtils.toDateInput(props.firstEntryDate)),
      formattedMaxDate: computed(() => mapUtils.toDateInput(props.lastEntryDate))
    };

    onMounted(() => {
      const dm = props.defaultMapping;
      state.selectedMappingIndex = dm?.map_index ?? '';

      state.selectedStartDate = computedScope.formattedMinDate.value;
      state.selectedEndDate = computedScope.formattedMaxDate.value;
    });

    const icons = {
      archive
    };

    return {
      state,
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/app/DrawerDownload.scss" lang="scss"></style>
