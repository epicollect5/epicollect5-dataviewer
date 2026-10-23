<template>
  <div class="dropdown">
    <button
      type="button"
      class="dropdown__trigger"
      :class="{ 'dropdown__trigger--disabled': disabled }"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="ariaExpanded"
      @click="openPopover"
    >
      <span
        class="dropdown__label"
        :class="labelClasses"
      >
        {{ triggerLabel }}
      </span>
      <ion-icon class="dropdown__icon" :icon="chevronDown" aria-hidden="true" />
    </button>

    <ion-popover
      class="dropdown-popover"
      :is-open="state.isOpen"
      :event="state.event"
      reference="trigger"
      side="bottom"
      alignment="start"
      :show-backdrop="false"
      @didDismiss="handleDismiss"
    >
      <ion-content class="dropdown-popover__content">
        <ion-list lines="none">
          <ion-item
            v-for="option in normalizedOptions"
            :key="getOptionKey(option)"
            button
            mode="md"
            detail="false"
            class="dropdown-popover__item"
            :class="getOptionItemClasses(option)"
            :disabled="isOptionDisabled(option)"
            @click="handleOptionSelect(option)"
          >
            <ion-label>{{ getOptionLabel(option) }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>
  </div>
</template>

<script>
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover
} from '@ionic/vue';
import { chevronDown } from 'ionicons/icons';
import { computed, reactive } from 'vue';

export default {
  name: 'Dropdown',
  components: {
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover
  },
  props: {
    options: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Number],
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Select'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    optionLabelKey: {
      type: String,
      default: 'label'
    },
    optionValueKey: {
      type: String,
      default: 'value'
    },
    optionDisabledKey: {
      type: String,
      default: 'disabled'
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const state = reactive({
      isOpen: false,
      event: undefined
    });

    const methods = {
      getOptionLabel(option) {
        if (typeof option === 'string' || typeof option === 'number') {
          return `${option}`;
        }

        return option?.[props.optionLabelKey] || '';
      },
      getOptionValue(option) {
        if (typeof option === 'string' || typeof option === 'number') {
          return option;
        }

        return option?.[props.optionValueKey];
      },
      isOptionDisabled(option) {
        if (typeof option === 'string' || typeof option === 'number') {
          return false;
        }

        return Boolean(option?.[props.optionDisabledKey]);
      },
      isSelectedOption(option) {
        const optionValue = methods.getOptionValue(option);

        if (optionValue === undefined || optionValue === null) {
          return false;
        }

        return String(optionValue) === String(props.modelValue);
      },
      getOptionKey(option) {
        return `dropdown-option-${methods.getOptionValue(option)}`;
      },
      getOptionItemClasses(option) {
        return {
          'dropdown-popover__item--selected': methods.isSelectedOption(option)
        };
      },
      openPopover(event) {
        if (props.disabled) {
          return;
        }

        //anchor the popover to the whole trigger: Ionic positions it from the
        //clicked element's rect, so clicking the chevron would open it off screen
        state.event = {
          target: event.currentTarget,
          clientX: event.clientX,
          clientY: event.clientY
        };
        state.isOpen = true;
      },
      closePopover() {
        state.isOpen = false;
        state.event = undefined;
      },
      handleDismiss() {
        methods.closePopover();
      },
      handleOptionSelect(option) {
        if (methods.isOptionDisabled(option)) {
          return;
        }

        const nextValue = methods.getOptionValue(option);
        emit('update:modelValue', nextValue);
        emit('change', nextValue);
        methods.closePopover();
      }
    };

    const computedScope = {
      normalizedOptions: computed(() => props.options || []),
      selectedOption: computed(() => {
        return computedScope.normalizedOptions.value.find((option) => methods.isSelectedOption(option)) || null;
      }),
      hasSelectedOption: computed(() => Boolean(computedScope.selectedOption.value)),
      labelClasses: computed(() => ({
        'dropdown__label--placeholder': !computedScope.hasSelectedOption.value
      })),
      ariaExpanded: computed(() => (state.isOpen ? 'true' : 'false')),
      triggerLabel: computed(() => {
        if (computedScope.selectedOption.value) {
          return methods.getOptionLabel(computedScope.selectedOption.value);
        }

        return props.placeholder;
      })
    };

    const icons = {
      chevronDown
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
<style src="@/theme/global/Dropdown.scss" lang="scss"></style>
