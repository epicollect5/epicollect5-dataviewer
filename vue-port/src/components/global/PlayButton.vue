<template>
  <button
    type="button"
    class="play-button"
    :class="buttonClasses"
    :aria-label="buttonLabel"
    @click="handleClick"
  >
    <ion-icon :icon="play" class="play-button__icon" aria-hidden="true" />
    <span class="play-button__label">{{ buttonLabel }}</span>
  </button>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { play } from 'ionicons/icons';
import { computed } from 'vue';

export default {
  name: 'PlayButton',
  components: {
    IonIcon
  },
  props: {
    label: {
      type: String,
      default: 'Play'
    },
    fullWidth: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const methods = {
      handleClick(event) {
        emit('click', event);
      }
    };

    const computedScope = {
      buttonLabel: computed(() => props.label || 'Play'),
      buttonClasses: computed(() => ({
        'play-button--block': props.fullWidth
      }))
    };

    const icons = {
      play
    };

    return {
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/global/PlayButton.scss" lang="scss"></style>
