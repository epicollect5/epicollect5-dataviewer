<template>
  <ion-app>
    <DrawerWrapper />
    <ion-page id="app-shell-content" class="app-shell-page" :class="{ 'app-shell-page--ready': !isProjectBootLoading }">
      <NavbarPrimary v-if="!isProjectBootLoading" />
      <ion-content id="app-shell-main-content" fullscreen>
        <router-view v-slot="{ Component }">
          <keep-alive include="PageData">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </ion-content>
      <ToastWrapper />
      <ModalWrapper />
      <OverlayWait />
    </ion-page>

    <transition name="app-shell-fade">
      <div v-if="isProjectBootLoading" class="app-shell-loader">
        <LoaderSpinner />
      </div>
    </transition>
  </ion-app>
</template>

<script>
import {
  IonApp,
  IonContent,
  IonPage
} from '@ionic/vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import env from '@/core/config/env';
import NavbarPrimary from '@/components/app/NavbarPrimary.vue';
import DrawerWrapper from '@/components/app/DrawerWrapper.vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import ModalWrapper from '@/components/app/ModalWrapper.vue';
import ToastWrapper from '@/components/app/ToastWrapper.vue';
import OverlayWait from '@/components/app/OverlayWait.vue';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

export default {
  name: 'AppShell',
  components: {
    IonApp,
    IonContent,
    IonPage,
    NavbarPrimary,
    DrawerWrapper,
    LoaderSpinner,
    ModalWrapper,
    ToastWrapper,
    OverlayWait
  },
  setup() {
    const route = useRoute();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    const resolvedProjectSlug = computed(() => {
      return route.params.projectSlug || route.query.project || env.projectSlug || '';
    });

    return {
      isProjectBootLoading: computed(() => {
        if (!resolvedProjectSlug.value) {
          return false;
        }

        if (projectStore.isRejected && projectStore.projectSlug === resolvedProjectSlug.value) {
          return false;
        }

        if (projectStore.projectSlug !== resolvedProjectSlug.value) {
          return true;
        }

        if (projectStore.isFetching && !projectStore.isFulfilled) {
          return true;
        }

        if (tableStore.lastLoadedProjectSlug !== resolvedProjectSlug.value) {
          return true;
        }

        return !tableStore.hasLoadedInitialPage && !tableStore.isRejectedPage;
      })
    };
  }
};
</script>
<style src="@/theme/app/Main.scss" lang="scss"></style>
