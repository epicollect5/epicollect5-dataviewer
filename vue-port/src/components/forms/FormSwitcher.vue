<template>
  <label class="form-switcher">
    <span class="form-switcher__label">Form</span>
    <select :value="props.selectedFormRef" @change="handleChange($event.target.value)">
      <option v-for="form in props.forms" :key="form.ref" :value="form.ref">
        {{ form.name }}
      </option>
    </select>
  </label>
</template>

<script>
export default {
  name: 'FormSwitcher',
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
      props,
      ...methods
    };
  }
};
</script>
<style src="@/theme/forms/FormSwitcher.scss" lang="scss"></style>
