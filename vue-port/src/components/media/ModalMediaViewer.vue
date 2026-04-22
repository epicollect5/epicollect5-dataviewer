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
      <audio v-if="isAudio" :src="src" controls autoplay class="media-player-modal__player"></audio>
      <video v-else :src="src" controls autoplay class="media-player-modal__player"></video>
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
import { computed } from 'vue';
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

    const methods = {
      closeModal() {
        modalStore.close();
      }
    };

    const computedState = {
      payload: computed(() => modalStore.payload || {}),
      title: computed(() => computedState.payload.value.title || 'Media'),
      src: computed(() => computedState.payload.value.src || ''),
      isAudio: computed(() => computedState.payload.value.mediaType === 'audio'),
      modalStyle: computed(() => ({
        '--width': 'min(92vw, 960px)',
        '--height': 'min(70vh, 680px)',
        '--max-width': '92vw',
        '--max-height': '70vh'
      }))
    };

    expose({
      modalStyle: computedState.modalStyle
    });

    return {
      ...methods,
      ...computedState,
      close
    };
  }
};
</script>
