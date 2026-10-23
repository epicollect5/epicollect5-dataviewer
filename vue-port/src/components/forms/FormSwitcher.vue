<template>
  <label class="form-switcher">
    <span class="form-switcher__label">Form</span>
    <Dropdown
      :model-value="selectedFormRef"
      :options="forms"
      option-label-key="name"
      option-value-key="ref"
      @change="handleChange"
    />
  </label>
</template>

<script>
import Dropdown from '@/components/global/Dropdown.vue';

export default {
  name: 'FormSwitcher',
  components: {
    Dropdown
  },
  props: {
    forms: {
      type: Array,
      default: () => []
    },
    selectedFormRef: {
      type: String,
      default: ''
    }
  },
  emits: ['change'],
  setup(props, { emit }) {
    const methods = {
      handleChange(value) {
        emit('change', value);
      }
    };

    return {
      ...methods
    };
  }
};
</script>
<style src="@/theme/forms/FormSwitcher.scss" lang="scss"></style>
