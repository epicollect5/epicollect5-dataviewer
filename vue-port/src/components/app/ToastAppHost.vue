<template>
  <ion-toast
    :is-open="toast.isOpen"
    :message="toast.message"
    :color="toast.color"
    :duration="toast.duration"
    @didDismiss="toastStore.dismiss()"
  />
</template>

<script setup>
import { IonToast } from '@ionic/vue';
import { storeToRefs } from 'pinia';
import { useToastStore } from '@/stores/toastStore';

const toastStore = useToastStore();
const { toast } = storeToRefs(toastStore);
</script>
