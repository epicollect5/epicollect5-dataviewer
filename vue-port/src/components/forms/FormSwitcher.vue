<template>
  <label class="form-switcher">
    <span class="form-switcher__label">Form</span>
    <select :value="selectedFormRef" @change="$emit('change', $event.target.value)">
      <option v-for="form in forms" :key="form.ref" :value="form.ref">
        {{ form.name }}
      </option>
    </select>
  </label>
</template>

<script setup>
defineProps({
  forms: {
    type: Array,
    default: () => []
  },
  selectedFormRef: {
    type: String,
    default: ''
  }
});

defineEmits(['change']);
</script>
