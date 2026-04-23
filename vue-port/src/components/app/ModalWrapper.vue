<template>
  <ModalPhotoViewer />

  <ion-modal :is-open="activeModal !== null" :style="modalStyle" @didDismiss="closeModal">
    <ModalUpload v-if="activeModal === 'upload'" />
    <ModalDeleteEntry v-else-if="activeModal === 'delete-entry'" />
    <ModalMediaViewer v-else-if="activeModal === 'media-viewer'" :ref="setMediaViewerModal" />
    <ModalViewEntry v-else-if="activeModal === 'view-entry'" />
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
      ...computedScope
    };
  }
};
</script>
