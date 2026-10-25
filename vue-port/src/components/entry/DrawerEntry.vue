<template>
  <transition name="fade" mode="out-in">
    <div v-if="isFetchingEntry" key="loading" class="drawer-entry__loader">
      <LoaderSpinner />
    </div>

    <div v-else-if="!hasEntrySections" key="empty" class="drawer-entry__loader drawer-entry__loader--empty">
      No entry selected.
    </div>

    <ion-list v-else key="content" class="drawer-entry__content" lines="none">
      <ion-item class="drawer-entry__group" :detail="false">
        <div class="drawer-entry__item-content">
          <div class="drawer-entry__question drawer-entry__question--title">{{ entryTitle }}</div>
        </div>
      </ion-item>

      <ion-item class="drawer-entry__group" :detail="false">
        <div class="drawer-entry__item-content drawer-entry__actions">
          <button
            type="button"
            class="drawer-entry__action"
            :disabled="!canEditEntry"
            aria-label="Edit entry"
            @click="handleEdit"
          >
            <ion-icon :icon="pencil" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            class="drawer-entry__action drawer-entry__action--delete"
            :disabled="!canEditEntry"
            aria-label="Delete entry"
            @click="handleDelete"
          >
            <ion-icon :icon="trash" />
            <span>Delete</span>
          </button>
        </div>
      </ion-item>

      <ion-item class="drawer-entry__group" :detail="false">
        <div class="drawer-entry__item-content">
          <div class="drawer-entry__question">Created At</div>
          <div class="drawer-entry__answer">{{ entryCreatedAt }}</div>
        </div>
      </ion-item>

      <ion-item
        v-for="section in entrySections"
        :key="section.key"
        class="drawer-entry__group"
        :detail="false"
      >
        <div class="drawer-entry__item-content">
          <div class="drawer-entry__question">{{ section.question }}</div>
          <div class="drawer-entry__answer">
            <template v-if="section.isPhoto">
              <button
                type="button"
                class="drawer-entry__photo-button"
                @click="openSectionPhoto(section)"
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
                        :class="getPhotoClasses(section.key)"
                        @load="handleThumbLoad(section.key)"
                      />
                    </span>
                  </span>
                </span>
              </button>
            </template>
            <template v-else-if="section.isAudio">
              <PlayButton
                label="Play audio"
                :full-width="true"
                @click="openSectionMedia(section)"
              />
            </template>
            <template v-else-if="section.isVideo">
              <PlayButton
                label="Play video"
                :full-width="true"
                @click="openSectionMedia(section)"
              />
            </template>
            <template v-else>
              {{ section.value }}
            </template>
          </div>
        </div>
      </ion-item>
    </ion-list>
  </transition>
</template>

<script>
import { IonIcon, IonItem, IonList } from '@ionic/vue';
import { pencil, trash } from 'ionicons/icons';
import { computed, reactive } from 'vue';
import PARAMETERS from '@/core/config/parameters';
import tableModel from '@/core/entries/tableModel';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import PlayButton from '@/components/global/PlayButton.vue';
import { canEditEntryForProjectUser, openEditEntry } from '@/services/entries/dataEditorFlow';
import { useMapStore } from '@/stores/mapStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

export default {
  name: 'DrawerEntry',
  components: {
    IonIcon,
    IonItem,
    IonList,
    LoaderSpinner,
    PlayButton
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
      loadedThumbs: {}
    });

    const methods = {
      openPhoto(title, src, previewSrc) {
        modalStore.openPhotoViewer({
          title,
          src,
          previewSrc
        });
      },
      openMedia(mediaType, title, src) {
        modalStore.open('media-viewer', {
          mediaType,
          title,
          src
        });
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
      buildEntrySection(header, answer, index) {
        const kind = methods.getAnswerKind(answer);

        return {
          key: `${header.question}-${index}`,
          question: header.question,
          kind,
          value: answer.answer,
          isPhoto: kind === 'photo',
          isAudio: kind === 'audio',
          isVideo: kind === 'video'
        };
      },
      getPhotoPreview(value) {
        return value?.entry_thumb || value?.entry_default || '';
      },
      openSectionPhoto(section) {
        methods.openPhoto(
          computedScope.entryTitle.value,
          section.value?.entry_original,
          methods.getPhotoPreview(section.value)
        );
      },
      handleEdit() {
        openEditEntry({ entryUuid: computedScope.entryData.value?.entryUuid || null });
      },
      handleDelete() {
        modalStore.open('delete-entry', {
          entryUuid: computedScope.entryData.value?.entryUuid || null,
          entryTitle: computedScope.entryTitle.value,
          entryExtra: {
            attributes: computedScope.entryData.value?.attributes,
            relationships: computedScope.entryData.value?.relationships
          }
        });
      },
      openSectionMedia(section) {
        methods.openMedia(
          section.kind,
          section.question,
          section.value?.entry_original
        );
      },
      isThumbLoading(key) {
        return state.loadedThumbs[key] !== true;
      },
      getPhotoClasses(key) {
        return {
          'drawer-entry__photo--ready': !methods.isThumbLoading(key)
        };
      },
      handleThumbLoad(key) {
        state.loadedThumbs = {
          ...state.loadedThumbs,
          [key]: true
        };
      }
    };

    const computedScope = {
      isFetchingEntry: computed(() => mapStore.isFetchingEntry),
      entryData: computed(() => {
        //the clicked marker belongs to the form the locations were loaded for,
        //which can differ from the table's form after a data editor round trip
        const formRef = mapStore.lastLoadedFormRef || navigationStore.currentFormRef;

        if (!mapStore.selectedEntry || !formRef) {
          return null;
        }

        const branchRef = mapStore.selectedLocationQuestion?.branch_ref || '';
        const rows = tableModel.getRows(
          projectStore.projectSlug,
          projectStore.projectExtra,
          formRef,
          mapStore.selectedEntry,
          branchRef
        );

        if (rows.length === 0) {
          return null;
        }

        const row = rows[0];
        const headers = branchRef
          ? tableModel.getBranchHeaders(projectStore.projectExtra, formRef, branchRef)
          : tableModel.getHeaders(projectStore.projectExtra, formRef);

        const titleIndex = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX;
        const createdAtIndex = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX;
        const answerOffset = branchRef
          ? PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1
          : PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;

        //the drawer actions need the same entry uuid and ownership the grid uses
        const actionCell = row.find((cell) => cell?.cellType === PARAMETERS.CEll_TYPES.EDIT) || {};
        const ownershipCell = row.find((cell) => cell?.attributes && cell?.relationships) || {};

        return {
          title: row[titleIndex]?.answer || 'Untitled entry',
          createdAt: row[createdAtIndex]?.answer || '',
          answers: row.slice(answerOffset),
          headers,
          entryUuid: actionCell.entryUuid || ownershipCell.entryUuid || '',
          attributes: ownershipCell.attributes,
          relationships: ownershipCell.relationships
        };
      }),
      canEditEntry: computed(() => {
        return canEditEntryForProjectUser({
          relationships: computedScope.entryData.value?.relationships
        });
      }),
      entryTitle: computed(() => computedScope.entryData.value?.title || 'Entry'),
      entryCreatedAt: computed(() => computedScope.entryData.value?.createdAt || ''),
      entrySections: computed(() => {
        if (!computedScope.entryData.value) {
          return [];
        }

        return computedScope.entryData.value.answers
          .map((answer, index) => {
            const header = computedScope.entryData.value.headers[index];

            if (!header) {
              return null;
            }

            return methods.buildEntrySection(header, answer, index);
          })
          .filter(Boolean);
      }),
      hasEntrySections: computed(() => computedScope.entrySections.value.length > 0)
    };

    const icons = {
      pencil,
      trash
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
<style src="@/theme/entry/DrawerEntry.scss" lang="scss"></style>
