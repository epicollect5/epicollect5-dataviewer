<template>
  <ion-modal :is-open="activeModal !== null" :style="modalStyle" @didDismiss="modalStore.close()">
    <UploadModal v-if="activeModal === 'upload'" />
    <DeleteEntryModal v-else-if="activeModal === 'delete-entry'" />
    <MediaViewerModal v-else-if="activeModal === 'media-viewer'" ref="mediaViewerModal" />
    <ViewEntryModal v-else-if="activeModal === 'view-entry'" />
    <ion-content v-else class="ion-padding">
      <h2>{{ modalTitle }}</h2>
      <p>Modal placeholder.</p>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { IonContent, IonModal } from '@ionic/vue';
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import DeleteEntryModal from '@/components/entry/ModalDeleteEntry.vue';
import ViewEntryModal from '@/components/entry/ModalViewEntry.vue';
import MediaViewerModal from '@/components/media/ModalMediaViewer.vue';
import UploadModal from '@/components/upload/ModalUpload.vue';
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();
const { activeModal } = storeToRefs(modalStore);
const mediaViewerModal = ref(null);

const modalTitle = computed(() => activeModal.value || 'Modal');
const modalStyle = computed(() => {
  if (activeModal.value === 'media-viewer') {
    return mediaViewerModal.value?.modalStyle || {};
  }

  if (activeModal.value === 'view-entry') {
    return {
      '--width': '80vw',
      '--max-width': '80vw',
      '--height': 'min(85vh, 960px)',
      '--max-height': '85vh'
    };
  }

  return {};
});
</script>
