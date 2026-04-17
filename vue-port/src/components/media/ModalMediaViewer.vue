<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ title }}</ion-title>
      <ion-buttons slot="end">
        <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close media viewer" @click="modalStore.close()">
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

<script setup>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();

const payload = computed(() => modalStore.payload || {});
const mediaType = computed(() => payload.value.mediaType || 'photo');
const title = computed(() => payload.value.title || 'Media');
const src = computed(() => payload.value.src || '');
const isPhoto = computed(() => mediaType.value === 'photo');
const isAudio = computed(() => mediaType.value === 'audio');
const isPhotoLoading = ref(isPhoto.value);
const photoAspectRatio = ref(4 / 3);
const viewportWidth = ref(0);
const viewportHeight = ref(0);

const FRAME_BORDER = 6;
const MODAL_PADDING = 24;
const MODAL_CHROME_HEIGHT = 84;

const syncViewport = () => {
  if (typeof window === 'undefined') {
    return;
  }

  viewportWidth.value = window.innerWidth;
  viewportHeight.value = window.innerHeight;
};

const photoLayout = computed(() => {
  const maxWidth = Math.max(320, viewportWidth.value - 48);
  const maxHeight = Math.max(240, viewportHeight.value - 120);
  let width = maxHeight * photoAspectRatio.value;
  let height = maxHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / photoAspectRatio.value;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
});

const photoFrameStyle = computed(() => {
  if (!isPhoto.value) {
    return {};
  }

  return {
    width: `${photoLayout.value.width + FRAME_BORDER}px`,
    height: `${photoLayout.value.height + FRAME_BORDER}px`
  };
});

const contentClass = computed(() => {
  return isPhoto.value ? 'photo-lightbox__content' : 'media-player-modal__content';
});

const handlePhotoLoad = (event) => {
  const image = event.target;

  if (image?.naturalWidth && image?.naturalHeight) {
    photoAspectRatio.value = image.naturalWidth / image.naturalHeight;
  }

  isPhotoLoading.value = false;
};

onMounted(() => {
  syncViewport();
  window.addEventListener('resize', syncViewport);
  isPhotoLoading.value = isPhoto.value;
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport);
});

defineExpose({
  modalStyle: computed(() => {
    if (!isPhoto.value) {
      return {
        '--width': 'min(92vw, 960px)',
        '--height': 'min(70vh, 680px)',
        '--max-width': '92vw',
        '--max-height': '70vh'
      };
    }

    return {
      '--width': `${photoLayout.value.width + FRAME_BORDER + MODAL_PADDING}px`,
      '--height': `${photoLayout.value.height + FRAME_BORDER + MODAL_PADDING + MODAL_CHROME_HEIGHT}px`,
      '--max-width': '96vw',
      '--max-height': '94vh'
    };
  })
});
</script>
