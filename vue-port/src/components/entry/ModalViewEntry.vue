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
                <template v-if="row.isPhoto">
                  <button
                    type="button"
                    class="view-entry-modal__photo-button"
                    @click="openRowPhoto(row)"
                  >
                    <span class="view-entry-modal__photo-frame">
                      <span class="view-entry-modal__photo-mat">
                        <span class="view-entry-modal__photo-viewport">
                          <img :src="row.preview" :alt="row.question" class="view-entry-modal__photo-thumb" />
                        </span>
                      </span>
                    </span>
                  </button>
                </template>
                <template v-else-if="row.isAudio">
                  <button type="button" class="view-entry-modal__media-button" @click="openRowMedia(row)">
                    Play audio
                  </button>
                </template>
                <template v-else-if="row.isVideo">
                  <button type="button" class="view-entry-modal__media-button" @click="openRowMedia(row)">
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
      },
      getAnswerKind(answer) {
        if (!answer.answer) {
          return 'text';
        }

        if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE) {
          return 'photo';
        }

        if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE) {
          return 'audio';
        }

        if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE) {
          return 'video';
        }

        return 'text';
      },
      getPhotoPreview(value) {
        return value?.entry_thumb || value?.entry_default || '';
      },
      openRowPhoto(row) {
        methods.openPhoto(
          computedScope.entryTitle.value,
          row.value?.entry_original,
          methods.getPhotoPreview(row.value)
        );
      },
      openRowMedia(row) {
        methods.openMedia(
          row.kind,
          row.question,
          row.value?.entry_original
        );
      }
    };

    const computedScope = {
      payload: computed(() => modalStore.payload || {}),
      entryTitle: computed(() => computedScope.payload.value.entryTitle || 'Entry'),
      headers: computed(() => computedScope.payload.value.viewHeaders || []),
      answers: computed(() => computedScope.payload.value.viewAnswers || []),
      rows: computed(() => {
        return computedScope.answers.value.map((answer, index) => {
          const question = computedScope.headers.value[index]?.question || `Question ${index + 1}`;
          const kind = methods.getAnswerKind(answer);

          return {
            key: `${question}-${index}`,
            question,
            kind,
            value: answer.answer,
            preview: methods.getPhotoPreview(answer.answer),
            isPhoto: kind === 'photo',
            isAudio: kind === 'audio',
            isVideo: kind === 'video'
          };
        });
      })
    };

    const icons = {
      close
    };

    return {
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/entry/ModalViewEntry.scss" lang="scss"></style>
