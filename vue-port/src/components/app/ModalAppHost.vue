<template>
  <PhotoViewerModal v-if="activeModal === 'photo-viewer'" />

  <ion-modal :is-open="activeModal !== null && activeModal !== 'photo-viewer'" :style="modalStyle" @didDismiss="closeModal">
    <UploadModal v-if="activeModal === 'upload'" />
    <DeleteEntryModal v-else-if="activeModal === 'delete-entry'" />
    <MediaViewerModal v-else-if="activeModal === 'media-viewer'" :ref="setMediaViewerModal" />
    <ViewEntryModal v-else-if="activeModal === 'view-entry'" />
    <ion-content v-else class="ion-padding">
      <h2>{{ modalTitle }}</h2>
      <p>Modal placeholder.</p>
    </ion-content>
  </ion-modal>
</template>

<script>
import { IonContent, IonModal } from '@ionic/vue';
import { computed, reactive } from 'vue';
import DeleteEntryModal from '@/components/entry/ModalDeleteEntry.vue';
import ViewEntryModal from '@/components/entry/ModalViewEntry.vue';
import MediaViewerModal from '@/components/media/ModalMediaViewer.vue';
import PhotoViewerModal from '@/components/media/ModalPhotoViewer.vue';
import UploadModal from '@/components/upload/ModalUpload.vue';
import { useModalStore } from '@/stores/modalStore';

export default {
  name: 'ModalAppHost',
  components: {
    IonContent,
    IonModal,
    DeleteEntryModal,
    ViewEntryModal,
    MediaViewerModal,
    PhotoViewerModal,
    UploadModal
  },
  setup() {
    const modalStore = useModalStore();

    const state = reactive({
      modalStore,
      mediaViewerModal: null
    });

    const methods = {
      setMediaViewerModal(instance) {
        state.mediaViewerModal = instance;
      },
      closeModal() {
        modalStore.close();
      }
    };

    const computedState = {
      activeModal: computed(() => modalStore.activeModal),
      modalTitle: computed(() => modalStore.activeModal || 'Modal'),
      modalStyle: computed(() => {
        if (modalStore.activeModal === 'media-viewer') {
          return state.mediaViewerModal?.modalStyle || {};
        }

        if (modalStore.activeModal === 'view-entry') {
          return {
            '--width': '80vw',
            '--max-width': '80vw',
            '--height': 'min(85vh, 960px)',
            '--max-height': '85vh'
          };
        }

        return {};
      })
    };

    return {
      state,
      ...methods,
      ...computedState
    };
  }
};
</script>
