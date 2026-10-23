<template>
  <Teleport to="body">
    <div class="map-progress-wrapper" :class="wrapperClasses">
      <div class="map-progress-wrapper__summary">{{ processed }}/{{ total }}</div>
      <div class="map-progress-bar">
        <div class="map-progress-bar__fill" :style="fillStyle"></div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { Teleport, computed } from 'vue';

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
  },
  setup(props) {
    const computedScope = {
      wrapperClasses: computed(() => ({
        'map-progress-wrapper--visible': props.isVisible
      })),
      fillStyle: computed(() => ({
        width: `${props.percentage}%`
      }))
    };

    return {
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/map/MapProgressBar.scss" lang="scss"></style>
