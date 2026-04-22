<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Entry: {{ entryTitle }}</ion-title>
      <ion-buttons slot="end">
        <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close entry view" @click="closeModal">
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
                  <button
                    type="button"
                    class="view-entry-modal__photo-button"
                    @click="openPhoto(entryTitle, row.value.entry_original, row.value.entry_thumb || row.value.entry_default)"
                  >
                    <span class="view-entry-modal__photo-frame">
                      <span class="view-entry-modal__photo-mat">
                        <span class="view-entry-modal__photo-viewport">
                          <img :src="row.value.entry_thumb || row.value.entry_default" :alt="row.question" class="view-entry-modal__photo-thumb" />
                        </span>
                      </span>
                    </span>
                  </button>
                </template>
                <template v-else-if="row.kind === 'audio'">
                  <button type="button" class="view-entry-modal__media-button" @click="openMedia('audio', row.question, row.value.entry_original)">
                    Play audio
                  </button>
                </template>
                <template v-else-if="row.kind === 'video'">
                  <button type="button" class="view-entry-modal__media-button" @click="openMedia('video', row.question, row.value.entry_original)">
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
  </ion-content>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed } from 'vue';
import PARAMETERS from '@/core/config/parameters';
import { useModalStore } from '@/stores/modalStore';

export default {
  name: 'ModalViewEntry',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar
  },
  setup() {
    const modalStore = useModalStore();

    const methods = {
      openPhoto(title, src, previewSrc) {
        modalStore.openPhotoViewer({
          title,
          src,
          previewSrc
        });
      },
      openMedia(type, title, src) {
        modalStore.open('media-viewer', {
          mediaType: type,
          title,
          src
        });
      },
      closeModal() {
        modalStore.close();
      }
    };

    const computedState = {
      payload: computed(() => modalStore.payload || {}),
      entryTitle: computed(() => computedState.payload.value.entryTitle || 'Entry'),
      headers: computed(() => computedState.payload.value.viewHeaders || []),
      answers: computed(() => computedState.payload.value.viewAnswers || []),
      rows: computed(() => {
        return computedState.answers.value.map((answer, index) => {
          const question = computedState.headers.value[index]?.question || `Question ${index + 1}`;

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
      })
    };

    return {
      ...methods,
      ...computedState,
      close
    };
  }
};
</script>
<style src="@/theme/entry/ModalViewEntry.scss" lang="scss"></style>
