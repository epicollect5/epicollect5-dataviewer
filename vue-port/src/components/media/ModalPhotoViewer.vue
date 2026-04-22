<template>
  <div v-if="state.showOverlayLoader" class="photo-lightbox__overlay-loader" aria-live="polite">
    <LoaderSpinner />
  </div>

  <VueEasyLightbox
    :visible="isVisible"
    :imgs="images"
    :index="0"
    :title-disabled="true"
    :move-disabled="true"
    :rotate-disabled="true"
    :zoom-disabled="true"
    :pinch-disabled="true"
    :dblclick-disabled="true"
    @hide="closeModal"
  >
    <template #toolbar />
  </VueEasyLightbox>
</template>

<script>
import { computed, onBeforeUnmount, reactive, watch, toRefs } from 'vue';
import VueEasyLightbox from 'vue-easy-lightbox';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { useModalStore } from '@/stores/modalStore';

export default {
  name: 'ModalPhotoViewer',
  components: {
    VueEasyLightbox,
    LoaderSpinner
  },
  setup() {
    const modalStore = useModalStore();
    const state = reactive({
      showOverlayLoader: false
    });

    let pollTimer = null;

    const clearPollTimer = () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const methods = {
      stopOverlayLoader() {
        console.log('stopOverlayLoader called, current state:', state.showOverlayLoader);
        state.showOverlayLoader = false;
        console.log('stopOverlayLoader set to:', state.showOverlayLoader);
        clearPollTimer();
      },
      startOverlayLoader() {
        if (typeof document === 'undefined') {
          state.showOverlayLoader = false;
          return;
        }

        state.showOverlayLoader = true;
        clearPollTimer();

        pollTimer = window.setInterval(() => {
          const image = document.querySelector('.vel-modal .vel-img');
          const errorState = document.querySelector('.vel-modal .vel-on-error');

          if (errorState) {
            methods.stopOverlayLoader();
            return;
          }

          if (image) {
            // Check if already loaded
            if (image.complete && image.naturalHeight > 0) {
              methods.stopOverlayLoader();
              return;
            }

            // If not loaded yet, attach listeners (only once)
            if (!image.dataset.listenerAttached) {
              image.dataset.listenerAttached = 'true';
              image.addEventListener('load', methods.stopOverlayLoader, { once: true });
              image.addEventListener('error', methods.stopOverlayLoader, { once: true });
            }
          }
        }, 50);
      },
      closeModal() {
        methods.stopOverlayLoader();
        modalStore.close();
      }
    };

    const computedState = {
      isVisible: computed(() => modalStore.activeModal === 'photo-viewer'),
      images: computed(() => {
        const payload = modalStore.payload || {};

        if (!payload.src) {
          return [];
        }

        return [{
          src: payload.src,
          alt: payload.title || 'Photo'
        }];
      })
    };

    watch(
      () => computedState.isVisible.value,
      (isVisible) => {
        if (!isVisible) {
          methods.stopOverlayLoader();
          return;
        }

        methods.startOverlayLoader();
      },
      {
        immediate: true
      }
    );

    onBeforeUnmount(() => {
      clearPollTimer();
    });

    return {
      state,
      ...computedState,
      ...methods
    };
  }
};
</script>
<style src="@/theme/media/ModalPhotoViewer.scss" lang="scss"></style>
