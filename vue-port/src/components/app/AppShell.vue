<template>
  <ion-app>
    <ion-page>
      <AppHeader />
      <ion-content fullscreen>
        <router-view />
      </ion-content>
      <AppDrawerHost />
      <AppToastHost />
      <AppModalHost />
      <OverlayWait />
    </ion-page>
  </ion-app>
</template>

<script setup>
import {
  IonApp,
  IonContent,
  IonPage
} from '@ionic/vue';
import AppHeader from '@/components/app/AppHeader.vue';
import AppDrawerHost from '@/components/app/DrawerAppHost.vue';
import AppModalHost from '@/components/app/ModalAppHost.vue';
import AppToastHost from '@/components/app/ToastAppHost.vue';
import OverlayWait from '@/components/app/OverlayWait.vue';
</script>
