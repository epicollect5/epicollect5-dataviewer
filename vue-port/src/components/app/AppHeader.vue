<template>
  <ion-header translucent>
    <ion-toolbar>
      <ion-title>{{ appName }}</ion-title>
      <ion-buttons slot="end">
        <ion-button
          :fill="activeRoute.includes('/map') ? 'clear' : 'solid'"
          :router-link="tableHref"
        >
          Table
        </ion-button>
        <ion-button
          :fill="activeRoute.includes('/map') ? 'solid' : 'clear'"
          :router-link="mapHref"
        >
          Map
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup>
import {
  IonButton,
  IonButtons,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAppShellStore } from '@/stores/appShellStore';

const route = useRoute();
const appShellStore = useAppShellStore();

const appName = computed(() => appShellStore.appName);
const activeRoute = computed(() => route.path);
const tableHref = computed(() => {
  if (route.params.projectSlug) {
    return `/${route.params.projectSlug}/data`;
  }

  if (route.query.project) {
    return `/table?project=${route.query.project}`;
  }

  return '/table';
});

const mapHref = computed(() => {
  if (route.params.projectSlug) {
    return `/${route.params.projectSlug}/data/map`;
  }

  if (route.query.project) {
    return `/map?project=${route.query.project}`;
  }

  return '/map';
});
</script>
