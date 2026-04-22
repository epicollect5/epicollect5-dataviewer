<template>
  <div v-if="isBusy" class="wait-overlay">
    <LoaderSpinner />
    <span>Working…</span>
  </div>
</template>

<script>
import { computed, reactive } from 'vue';
import { useNavigationStore } from '@/stores/navigationStore';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';

export default {
  name: 'OverlayWait',
  components: {
    LoaderSpinner
  },
  setup() {
    const navigationStore = useNavigationStore();

    const state = reactive({
      navigationStore
    });

    const computedState = {
      isBusy: computed(() => navigationStore.isPerformingLongAction)
    };

    return {
      state,
      ...computedState
    };
  }
};
</script>
