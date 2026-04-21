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

  <ion-content :scroll-y="false" :class="contentClass">
    <div v-if="isPhoto" class="photo-lightbox">
      <transition name="fade">
        <div v-if="isPhotoLoading" class="photo-lightbox__loader">
          <LoaderSpinner />
        </div>
      </transition>

      <div class="photo-lightbox__frame" :class="{ 'photo-lightbox__frame--loading': isPhotoLoading }" :style="photoFrameStyle">
        <div class="photo-lightbox__mat">
          <span class="photo-lightbox__viewport">
            <img
              :src="src"
              :alt="title"
              class="photo-lightbox__image"
              :class="{ 'photo-lightbox__image--ready': !isPhotoLoading }"
              @load="handlePhotoLoad"
            />
          </span>
        </div>
      </div>
    </div>

    <div v-else class="media-player-modal">
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
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { useModalStore } from '@/stores/modalStore';

const FRAME_BORDER = 6;
const MODAL_PADDING = 24;
const MODAL_CHROME_HEIGHT = 84;

export default {
  name: 'ModalMediaViewer',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    LoaderSpinner
  },
  setup(props, { expose }) {
    const modalStore = useModalStore();

    const state = reactive({
      modalStore,
      isPhotoLoading: true,
      photoAspectRatio: 4 / 3,
      viewportWidth: 0,
      viewportHeight: 0
    });

    const methods = {
      syncViewport() {
        if (typeof window === 'undefined') {
          return;
        }

        state.viewportWidth = window.innerWidth;
        state.viewportHeight = window.innerHeight;
      },
      handlePhotoLoad(event) {
        const image = event.target;

        if (image?.naturalWidth && image?.naturalHeight) {
          state.photoAspectRatio = image.naturalWidth / image.naturalHeight;
        }

        state.isPhotoLoading = false;
      },
      closeModal() {
        modalStore.close();
      }
    };

    const computedState = {
      payload: computed(() => modalStore.payload || {}),
      mediaType: computed(() => computedState.payload.value.mediaType || 'photo'),
      title: computed(() => computedState.payload.value.title || 'Media'),
      src: computed(() => computedState.payload.value.src || ''),
      isPhoto: computed(() => computedState.mediaType.value === 'photo'),
      isAudio: computed(() => computedState.mediaType.value === 'audio'),
      photoLayout: computed(() => {
        const maxWidth = Math.max(320, state.viewportWidth - 48);
        const maxHeight = Math.max(240, state.viewportHeight - 120);
        let width = maxHeight * state.photoAspectRatio;
        let height = maxHeight;

        if (width > maxWidth) {
          width = maxWidth;
          height = width / state.photoAspectRatio;
        }

        return {
          width: Math.round(width),
          height: Math.round(height)
        };
      }),
      photoFrameStyle: computed(() => {
        if (!computedState.isPhoto.value) {
          return {};
        }

        return {
          width: `${computedState.photoLayout.value.width + FRAME_BORDER}px`,
          height: `${computedState.photoLayout.value.height + FRAME_BORDER}px`
        };
      }),
      contentClass: computed(() => {
        return computedState.isPhoto.value ? 'photo-lightbox__content' : 'media-player-modal__content';
      }),
      modalStyle: computed(() => {
        if (!computedState.isPhoto.value) {
          return {
            '--width': 'min(92vw, 960px)',
            '--height': 'min(70vh, 680px)',
            '--max-width': '92vw',
            '--max-height': '70vh'
          };
        }

        return {
          '--width': `${computedState.photoLayout.value.width + FRAME_BORDER + MODAL_PADDING}px`,
          '--height': `${computedState.photoLayout.value.height + FRAME_BORDER + MODAL_PADDING + MODAL_CHROME_HEIGHT}px`,
          '--max-width': '96vw',
          '--max-height': '94vh'
        };
      })
    };

    onMounted(() => {
      methods.syncViewport();
      window.addEventListener('resize', methods.syncViewport);
      state.isPhotoLoading = computedState.isPhoto.value;
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', methods.syncViewport);
    });

    expose({
      modalStyle: computedState.modalStyle
    });

    return {
      ...state,
      ...methods,
      ...computedState,
      close
    };
  }
};
</script>
