import { defineStore } from 'pinia';

export const useModalStore = defineStore('modal', {
  state: () => ({
    activeModal: null,
    payload: null
  }),
  actions: {
    open(name, payload = null) {
      this.activeModal = name;
      this.payload = payload;
    },
    close() {
      this.activeModal = null;
      this.payload = null;
    }
  }
});
