<template>
  <ModalPhotoViewer />

  <ion-modal :is-open="isModalOpen" :style="modalStyle" @didDismiss="closeModal">
    <ModalUpload v-if="isUploadModal" />
    <ModalDeleteEntry v-else-if="isDeleteEntryModal" />
    <ModalMediaViewer v-else-if="isMediaViewerModal" :ref="setMediaViewerModal" />
    <ModalViewEntry v-else-if="isViewEntryModal" />
    <ModalPrepareDownload v-else-if="isPrepareDownloadModal" />
    <ion-content v-else class="ion-padding">
      <h2>{{ modalTitle }}</h2>
      <p>Modal placeholder.</p>
    </ion-content>
  </ion-modal>
</template>

<script>
import { IonContent, IonModal } from '@ionic/vue';
import { computed, reactive } from 'vue';
import ModalDeleteEntry from '@/components/entry/ModalDeleteEntry.vue';
import ModalViewEntry from '@/components/entry/ModalViewEntry.vue';
import ModalMediaViewer from '@/components/media/ModalMediaViewer.vue';
import ModalPhotoViewer from '@/components/media/ModalPhotoViewer.vue';
import ModalPrepareDownload from '@/components/main/ModalPrepareDownload.vue';
import ModalUpload from '@/components/upload/ModalUpload.vue';
import { useModalStore } from '@/stores/modalStore';

export default {
  name: 'ModalWrapper',
  components: {
    IonContent,
    IonModal,
    ModalDeleteEntry,
    ModalViewEntry,
    ModalMediaViewer,
    ModalPhotoViewer,
    ModalPrepareDownload,
    ModalUpload
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

    const computedScope = {
      activeModal: computed(() => modalStore.activeModal),
      isModalOpen: computed(() => modalStore.activeModal !== null),
      isUploadModal: computed(() => modalStore.activeModal === 'upload'),
      isDeleteEntryModal: computed(() => modalStore.activeModal === 'delete-entry'),
      isMediaViewerModal: computed(() => modalStore.activeModal === 'media-viewer'),
      isViewEntryModal: computed(() => modalStore.activeModal === 'view-entry'),
      isPrepareDownloadModal: computed(() => modalStore.activeModal === 'prepare-download'),
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

        if (modalStore.activeModal === 'prepare-download') {
          return {
            '--width': 'min(360px, calc(100vw - 32px))',
            '--height': '240px',
            '--border-radius': '8px'
          };
        }

        return {};
      })
    };

    return {
      state,
      ...methods,
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/app/ModalWrapper.scss" lang="scss"></style>
