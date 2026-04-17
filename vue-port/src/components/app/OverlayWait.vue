<template>
  <div v-if="isBusy" class="wait-overlay">
    <LoaderSpinner />
    <span>Working…</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNavigationStore } from '@/stores/navigationStore';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';

const navigationStore = useNavigationStore();
const isBusy = computed(() => navigationStore.isPerformingLongAction);
</script>
