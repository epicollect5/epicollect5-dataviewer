<template>
  <Teleport to="body">
    <div class="map-progress-wrapper" :class="{ 'map-progress-wrapper--visible': isVisible }">
      <div class="map-progress-wrapper__summary">{{ processed }}/{{ total }}</div>
      <div class="map-progress-bar">
        <div class="map-progress-bar__fill" :style="{ width: `${percentage}%` }"></div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { Teleport } from 'vue';

export default {
  name: 'MapProgressBar',
  components: {
    Teleport
  },
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
