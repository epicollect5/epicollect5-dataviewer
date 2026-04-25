<template>
  <button
    type="button"
    class="play-button"
    :class="{ 'play-button--block': fullWidth }"
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

    const computedState = {
      buttonLabel: computed(() => props.label || 'Play')
    };

    return {
      ...methods,
      ...computedState,
      play
    };
  }
};
</script>
