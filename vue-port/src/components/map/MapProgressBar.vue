<template>
  <div v-if="isVisible" class="map-progress-wrapper">
    <div class="map-progress-wrapper__summary">{{ processed }}/{{ total }}</div>
    <div class="map-progress-bar">
      <div class="map-progress-bar__fill" :style="{ width: `${percentage}%` }"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapProgressBar',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    processed: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }
};
</script>
<style src="@/theme/map/MapProgressBar.scss" lang="scss"></style>
