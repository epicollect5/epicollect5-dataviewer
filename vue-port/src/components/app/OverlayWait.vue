<template>
  <Teleport to="body">
    <div v-if="isBusy" class="wait-overlay">
      <LoaderSpinner />
      <span>Processing...</span>
    </div>
  </Teleport>
</template>

<script>
import { Teleport, computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useNavigationStore } from '@/stores/navigationStore';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';

export default {
  name: 'OverlayWait',
  components: {
    Teleport,
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

    watch(
      computedState.isBusy,
      (isBusy) => {
        if (typeof document === 'undefined') {
          return;
        }

        document.body.classList.toggle('app-busy', isBusy);
      },
      { immediate: true }
    );

    onBeforeUnmount(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('app-busy');
      }
    });

    return {
      state,
      ...computedState
    };
  }
};
</script>
<style src="@/theme/app/OverlayWait.scss" lang="scss"></style>
