<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close media viewer" @click="closeModal">
          <ion-icon slot="icon-only" :icon="close" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content :scroll-y="false" class="media-player-modal__content">
    <div class="media-player-modal">
      <audio
        v-if="isAudio"
        :src="src"
        controls
        autoplay
        :ref="setMediaElement"
        class="media-player-modal__player media-player-modal__player--audio"
      ></audio>
      <video
        v-else
        :src="src"
        controls
        autoplay
        :ref="setMediaElement"
        class="media-player-modal__player media-player-modal__player--video"
      ></video>
    </div>
  </ion-content>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useModalStore } from '@/stores/modalStore';

export default {
  name: 'ModalMediaViewer',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar
  },
  setup(props, { expose }) {
    const modalStore = useModalStore();
    const state = reactive({
      mediaElement: null
    });

    const methods = {
      setMediaElement(element) {
        state.mediaElement = element || null;
      },
      pauseMedia() {
        if (!state.mediaElement) {
          return;
        }

        state.mediaElement.pause();
        state.mediaElement.currentTime = 0;
      },
      closeModal() {
        methods.pauseMedia();
        modalStore.close();
      }
    };

    const computedScope = {
      payload: computed(() => modalStore.payload || {}),
      title: computed(() => computedScope.payload.value.title || 'Media'),
      src: computed(() => computedScope.payload.value.src || ''),
      isAudio: computed(() => computedScope.payload.value.mediaType === 'audio'),
      modalStyle: computed(() => {
        if (computedScope.isAudio.value) {
          return {
            '--width': 'min(42vw, 520px)',
            '--height': '190px',
            '--min-width': '280px',
            '--max-width': '92vw',
            '--max-height': '220px'
          };
        }

        return {
          '--width': 'min(36vw, 560px)',
          '--height': 'min(64vh, 460px)',
          '--min-width': '320px',
          '--max-width': '92vw',
          '--max-height': '76vh'
        };
      })
    };

    watch(
      () => modalStore.activeModal,
      (activeModal) => {
        if (activeModal !== 'media-viewer') {
          methods.pauseMedia();
        }
      }
    );

    onBeforeUnmount(() => {
      methods.pauseMedia();
    });

    expose({
      modalStyle: computedScope.modalStyle
    });

    const icons = {
      close
    };

    return {
      state,
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/media/ModalMediaViewer.scss" lang="scss"></style>
