<template>
  <ion-toast
    :is-open="toast.isOpen"
    :message="toast.message"
    :color="toast.color"
    :duration="toast.duration"
    @didDismiss="handleDismiss"
  />
</template>

<script>
import { IonToast } from '@ionic/vue';
import { computed, reactive } from 'vue';
import { useToastStore } from '@/stores/toastStore';

export default {
  name: 'ToastWrapper',
  components: {
    IonToast
  },
  setup() {
    const toastStore = useToastStore();

    const state = reactive({
      toastStore
    });

    const methods = {
      handleDismiss() {
        toastStore.dismiss();
      }
    };

    const computedScope = {
      toast: computed(() => toastStore.toast)
    };

    return {
      state,
      ...methods,
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/app/ToastWrapper.scss" lang="scss"></style>
