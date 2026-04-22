<template>
  <div class="drawer-map">
    <ion-list lines="none" class="drawer-map__list">
      <ion-item class="drawer-map__item" :detail="false">
        <label class="drawer-map__field">
          <span>Location question</span>
          <select :value="selectedLocationKey" @change="emitLocationChange($event.target.value)">
            <option v-for="question in props.locationQuestions" :key="getLocationKey(question)" :value="getLocationKey(question)">
              {{ question.question }}
            </option>
          </select>
        </label>
      </ion-item>

      <ion-item class="drawer-map__item" :detail="false">
        <label class="drawer-map__checkbox">
          <input :checked="props.clustersEnabled" type="checkbox" @change="emitClusterToggle($event.target.checked)" />
          <span>Group markers by coordinates</span>
        </label>
      </ion-item>

      <ion-item class="drawer-map__item" :detail="false">
        <label class="drawer-map__field">
          <span>From</span>
          <input :value="props.startDate" :min="props.minDate" :max="props.maxDate" type="date" @change="emitDateChange('startDate', $event.target.value)" />
        </label>
      </ion-item>

      <ion-item class="drawer-map__item" :detail="false">
        <label class="drawer-map__field">
          <span>To</span>
          <input :value="props.endDate" :min="props.minDate" :max="props.maxDate" type="date" @change="emitDateChange('endDate', $event.target.value)" />
        </label>
      </ion-item>

      <ion-item class="drawer-map__item" :detail="false">
        <button class="drawer-map__reset-button" type="button" @click="resetDates">Reset dates</button>
      </ion-item>
    </ion-list>

    <p class="drawer-map__summary">
      Showing {{ props.visibleCount }} marker{{ props.visibleCount === 1 ? '' : 's' }} from {{ props.totalCount }} location feature{{ props.totalCount === 1 ? '' : 's' }}.
    </p>
  </div>
</template>

<script>
import { IonItem, IonList } from '@ionic/vue';
import { computed } from 'vue';

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
  components: {
    IonItem,
    IonList
  },
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
<style src="@/theme/map/DrawerMap.scss" lang="scss"></style>
