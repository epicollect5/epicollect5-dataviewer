import { defineStore } from 'pinia';

export const useDrawerStore = defineStore('drawer', {
  state: () => ({
    activeDrawer: null,
    payload: null
  }),
  actions: {
    open(name, payload = null) {
      this.activeDrawer = name;
      this.payload = payload;
    },
    close() {
      this.activeDrawer = null;
      this.payload = null;
    }
  }
});
