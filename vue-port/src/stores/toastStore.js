import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({
    toast: {
      isOpen: false,
      message: '',
      color: 'dark',
      duration: 2000
    }
  }),
  actions: {
    show(message, options = {}) {
      this.toast = {
        isOpen: true,
        message,
        color: options.color || 'dark',
        duration: options.duration || 2000
      };
    },
    dismiss() {
      this.toast.isOpen = false;
    }
  }
});
