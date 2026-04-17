<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Entry: {{ entryTitle }}</ion-title>
      <ion-buttons slot="end">
        <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close entry view" @click="modalStore.close()">
          <ion-icon slot="icon-only" :icon="close" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-card class="view-entry-modal">
      <ion-card-content>
        <table class="view-entry-modal__table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Answer</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td>{{ row.question }}</td>
              <td>
                <template v-if="row.kind === 'photo'">
                  <button type="button" class="view-entry-modal__photo-button" @click="openMedia('photo', row.question, row.value.entry_original)">
                    <span class="entries-grid__photo-frame">
                      <span class="entries-grid__photo-mat">
                        <span class="entries-grid__photo-viewport entries-grid__photo-viewport--large">
                          <img :src="row.value.entry_default" :alt="row.question" class="entries-grid__photo-thumb entries-grid__photo-thumb--ready" />
                        </span>
                      </span>
                    </span>
                  </button>
                </template>
                <template v-else-if="row.kind === 'audio'">
                  <button type="button" class="entries-grid__media-button" @click="openMedia('audio', row.question, row.value.entry_original)">
                    Play audio
                  </button>
                </template>
                <template v-else-if="row.kind === 'video'">
                  <button type="button" class="entries-grid__media-button" @click="openMedia('video', row.question, row.value.entry_original)">
                    Play video
                  </button>
                </template>
                <template v-else>
                  {{ row.value }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </ion-card-content>
    </ion-card>

    <ion-modal class="photo-lightbox-modal" :is-open="activeMedia !== null" :style="mediaModalStyle" @didDismiss="closeMedia">
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ activeMedia?.title || 'Media' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close media viewer" @click="closeMedia">
              <ion-icon slot="icon-only" :icon="close" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content :scroll-y="false" :class="activeMedia?.type === 'photo' ? 'photo-lightbox__content' : 'media-player-modal__content'">
        <div v-if="activeMedia?.type === 'photo'" class="photo-lightbox">
          <transition name="fade">
            <div v-if="isPhotoLoading" class="photo-lightbox__loader">
              <LoaderSpinner />
            </div>
          </transition>
          <div class="photo-lightbox__frame" :class="{ 'photo-lightbox__frame--loading': isPhotoLoading }" :style="photoFrameStyle">
            <div class="photo-lightbox__mat">
              <span class="photo-lightbox__viewport">
                <img
                  :src="activeMedia.src"
                  :alt="activeMedia.title"
                  class="photo-lightbox__image"
                  :class="{ 'photo-lightbox__image--ready': !isPhotoLoading }"
                  @load="handlePhotoLoad"
                />
              </span>
            </div>
          </div>
        </div>
        <div v-else-if="activeMedia" class="media-player-modal">
          <audio v-if="activeMedia.type === 'audio'" :src="activeMedia.src" controls autoplay class="media-player-modal__player"></audio>
          <video v-else :src="activeMedia.src" controls autoplay class="media-player-modal__player"></video>
        </div>
      </ion-content>
    </ion-modal>
  </ion-content>
</template>

<script setup>
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import PARAMETERS from '@/config/parameters';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();
const payload = computed(() => modalStore.payload || {});
const entryTitle = computed(() => payload.value.entryTitle || 'Entry');
const headers = computed(() => payload.value.viewHeaders || []);
const answers = computed(() => payload.value.viewAnswers || []);
const activeMedia = ref(null);
const isPhotoLoading = ref(false);
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

const rows = computed(() => {
  return answers.value.map((answer, index) => {
    const question = headers.value[index]?.question || `Question ${index + 1}`;

    if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE && answer.answer) {
      return { key: `${question}-${index}`, question, kind: 'photo', value: answer.answer };
    }

    if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE && answer.answer) {
      return { key: `${question}-${index}`, question, kind: 'audio', value: answer.answer };
    }

    if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE && answer.answer) {
      return { key: `${question}-${index}`, question, kind: 'video', value: answer.answer };
    }

    return { key: `${question}-${index}`, question, kind: 'text', value: answer.answer };
  });
});

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

const photoFrameStyle = computed(() => ({
  width: `${photoLayout.value.width + FRAME_BORDER}px`,
  height: `${photoLayout.value.height + FRAME_BORDER}px`
}));

const mediaModalStyle = computed(() => {
  if (activeMedia.value?.type === 'photo') {
    return {
      '--width': `${photoLayout.value.width + FRAME_BORDER + MODAL_PADDING}px`,
      '--height': `${photoLayout.value.height + FRAME_BORDER + MODAL_PADDING + MODAL_CHROME_HEIGHT}px`,
      '--max-width': '96vw',
      '--max-height': '94vh'
    };
  }

  return {
    '--width': 'min(92vw, 960px)',
    '--height': 'min(70vh, 680px)',
    '--max-width': '92vw',
    '--max-height': '70vh'
  };
});

const openMedia = (type, title, src) => {
  syncViewport();
  activeMedia.value = { type, title, src };
  isPhotoLoading.value = type === 'photo';
};

const closeMedia = () => {
  activeMedia.value = null;
  isPhotoLoading.value = false;
};

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
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', syncViewport);
});
</script>
