<template>
  <ion-toast
    :is-open="toast.isOpen"
    :message="toast.message"
    :color="toast.color"
    :duration="toast.duration"
    @didDismiss="toastStore.dismiss()"
  />
</template>

<script>
import { IonToast } from '@ionic/vue';
import { reactive } from 'vue';
import { useToastStore } from '@/stores/toastStore';

export default {
  name: 'ToastAppHost',
  components: {
    IonToast
  },
  setup() {
    const toastStore = useToastStore();

    const state = reactive({
      toastStore
    });

    const computed = {
      toast: toastStore.toast
    };

    return {
      ...state,
      ...computed
    };
  }
};
</script>
