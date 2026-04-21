<template>
  <div class="drawer-entry-host">
    <section class="drawer-entry">
      <transition name="fade" mode="out-in">
        <div v-if="mapStore.isFetchingEntry" key="loading" class="drawer-entry__loader">
          <LoaderSpinner />
        </div>

        <div v-else-if="!entrySections.length" key="empty" class="drawer-entry__loader drawer-entry__loader--empty">
          No entry selected.
        </div>

        <div v-else key="content" class="drawer-entry__content">
          <section class="drawer-entry__group">
            <div class="drawer-entry__question drawer-entry__question--title">{{ entryTitle }}</div>
          </section>

          <section class="drawer-entry__group">
            <div class="drawer-entry__question">Created At</div>
            <div class="drawer-entry__answer">{{ entryCreatedAt }}</div>
          </section>

          <section
            v-for="section in entrySections"
            :key="section.key"
            class="drawer-entry__group"
          >
            <div class="drawer-entry__question">{{ section.question }}</div>
            <div class="drawer-entry__answer">
              <template v-if="section.kind === 'photo'">
                <button
                  type="button"
                  class="drawer-entry__photo-button"
                  @click="openPhoto(section.question, section.value.entry_original)"
                >
                  <span class="drawer-entry__photo-frame">
                    <span class="drawer-entry__photo-mat">
                      <span class="drawer-entry__photo-viewport">
                        <transition name="fade">
                          <span v-if="isThumbLoading(section.key)" class="drawer-entry__photo-loader">
                            <LoaderSpinner />
                          </span>
                        </transition>
                        <img
                          :src="section.value.entry_original"
                          :alt="section.question"
                          class="drawer-entry__photo"
                          :class="{ 'drawer-entry__photo--ready': !isThumbLoading(section.key) }"
                          @load="handleThumbLoad(section.key)"
                        />
                      </span>
                    </span>
                  </span>
                </button>
              </template>
              <template v-else-if="section.kind === 'audio'">
                <button
                  type="button"
                  class="drawer-entry__media-button"
                  @click="openMedia('audio', section.question, section.value.entry_original)"
                >
                  Play audio
                </button>
              </template>
              <template v-else-if="section.kind === 'video'">
                <button
                  type="button"
                  class="drawer-entry__media-button"
                  @click="openMedia('video', section.question, section.value.entry_original)"
                >
                  Play video
                </button>
              </template>
              <template v-else>
                {{ section.value }}
              </template>
            </div>
          </section>
        </div>
      </transition>
    </section>

    <ion-modal
      class="photo-lightbox-modal"
      :is-open="activePhoto !== null"
      :style="photoModalStyle"
      @didDismiss="closePhoto"
    >
      <ion-header>
        <ion-toolbar>
        <ion-title>{{ activePhoto?.title || 'Photo' }}</ion-title>
        <ion-buttons slot="end">
            <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close photo viewer" @click="closePhoto">
              <ion-icon slot="icon-only" :icon="close" />
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content :scroll-y="false" class="photo-lightbox__content">
        <div v-if="activePhoto" class="photo-lightbox">
          <transition name="fade">
            <div v-if="isPhotoLoading" class="photo-lightbox__loader">
              <LoaderSpinner />
            </div>
          </transition>

          <div
            class="photo-lightbox__frame"
            :class="{ 'photo-lightbox__frame--loading': isPhotoLoading }"
            :style="photoFrameStyle"
          >
            <div class="photo-lightbox__mat">
              <span class="photo-lightbox__viewport">
                <img
                  :src="activePhoto.src"
                  :alt="activePhoto.title"
                  class="photo-lightbox__image"
                  :class="{ 'photo-lightbox__image--ready': !isPhotoLoading }"
                  @load="handlePhotoLoad"
                />
              </span>
            </div>
          </div>
        </div>
      </ion-content>
    </ion-modal>
  </div>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import PARAMETERS from '@/config/parameters';
import tableModel from '@/core/entries/tableModel';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { useMapStore } from '@/stores/mapStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const FRAME_BORDER = 6;
const MODAL_PADDING = 24;
const MODAL_CHROME_HEIGHT = 84;

export default {
  name: 'DrawerEntry',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
    LoaderSpinner
  },
  setup() {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const mapStore = useMapStore();
    const modalStore = useModalStore();

    const state = reactive({
      projectStore,
      navigationStore,
      mapStore,
      activePhoto: null,
      isPhotoLoading: false,
      loadedThumbs: {},
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
      openPhoto(title, src) {
        methods.syncViewport();
        state.isPhotoLoading = true;
        state.activePhoto = {
          title,
          src
        };
      },
      closePhoto() {
        state.activePhoto = null;
        state.isPhotoLoading = false;
      },
      openMedia(mediaType, title, src) {
        modalStore.open('media-viewer', {
          mediaType,
          title,
          src
        });
      },
      handlePhotoLoad(event) {
        const image = event.target;

        if (image?.naturalWidth && image?.naturalHeight) {
          state.photoAspectRatio = image.naturalWidth / image.naturalHeight;
        }

        state.isPhotoLoading = false;
      },
      isThumbLoading(key) {
        return state.loadedThumbs[key] !== true;
      },
      handleThumbLoad(key) {
        state.loadedThumbs = {
          ...state.loadedThumbs,
          [key]: true
        };
      }
    };

    const computedState = {
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
        return {
          width: `${computedState.photoLayout.value.width + FRAME_BORDER}px`,
          height: `${computedState.photoLayout.value.height + FRAME_BORDER}px`
        };
      }),
      photoModalStyle: computed(() => {
        return {
          '--width': `${computedState.photoLayout.value.width + FRAME_BORDER + MODAL_PADDING}px`,
          '--height': `${computedState.photoLayout.value.height + FRAME_BORDER + MODAL_PADDING + MODAL_CHROME_HEIGHT}px`,
          '--max-width': '96vw',
          '--max-height': '94vh'
        };
      }),
      entryData: computed(() => {
        if (!mapStore.selectedEntry || !navigationStore.currentFormRef) {
          return null;
        }

        const branchRef = mapStore.selectedLocationQuestion?.branch_ref || '';
        const rows = tableModel.getRows(
          projectStore.projectSlug,
          projectStore.projectExtra,
          navigationStore.currentFormRef,
          mapStore.selectedEntry,
          branchRef
        );

        if (rows.length === 0) {
          return null;
        }

        const row = rows[0];
        const headers = branchRef
          ? tableModel.getBranchHeaders(projectStore.projectExtra, navigationStore.currentFormRef, branchRef)
          : tableModel.getHeaders(projectStore.projectExtra, navigationStore.currentFormRef);

        const titleIndex = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX;
        const createdAtIndex = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX;
        const answerOffset = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;

        return {
          title: row[titleIndex]?.answer || 'Untitled entry',
          createdAt: row[createdAtIndex]?.answer || '',
          answers: row.slice(answerOffset),
          headers
        };
      }),
      entryTitle: computed(() => computedState.entryData.value?.title || 'Entry'),
      entryCreatedAt: computed(() => computedState.entryData.value?.createdAt || ''),
      entrySections: computed(() => {
        if (!computedState.entryData.value) {
          return [];
        }

        return computedState.entryData.value.answers
          .map((answer, index) => {
            const header = computedState.entryData.value.headers[index];

            if (!header) {
              return null;
            }

            if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE && answer.answer) {
              return {
                key: `${header.question}-${index}`,
                question: header.question,
                kind: 'photo',
                value: answer.answer
              };
            }

            if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE && answer.answer) {
              return {
                key: `${header.question}-${index}`,
                question: header.question,
                kind: 'audio',
                value: answer.answer
              };
            }

            if (answer.inputType === PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE && answer.answer) {
              return {
                key: `${header.question}-${index}`,
                question: header.question,
                kind: 'video',
                value: answer.answer
              };
            }

            return {
              key: `${header.question}-${index}`,
              question: header.question,
              kind: 'text',
              value: answer.answer
            };
          })
          .filter(Boolean);
      })
    };

    onMounted(() => {
      methods.syncViewport();
      window.addEventListener('resize', methods.syncViewport);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', methods.syncViewport);
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
