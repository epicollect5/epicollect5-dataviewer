import { defineStore } from 'pinia';

export const useModalStore = defineStore('modal', {
  state: () => ({
    activeModal: null,
    payload: null,
    photoViewerPayload: null
  }),
  actions: {
    open(name, payload = null) {
      this.activeModal = name;
      this.payload = payload;
    },
    openPhotoViewer(payload = null) {
      this.photoViewerPayload = payload;
    },
    closePhotoViewer() {
      this.photoViewerPayload = null;
    },
    close() {
      this.activeModal = null;
      this.payload = null;
      this.photoViewerPayload = null;
    }
  }
});
