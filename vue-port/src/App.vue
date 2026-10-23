<template>
  <ion-app>
    <DrawerWrapper />
    <ion-page id="app-shell-content" class="app-shell-page" :class="pageClasses">
      <NavbarPrimary v-if="isProjectBootReady" />
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
import NavbarPrimary from '@/components/main/NavbarPrimary.vue';
import DrawerWrapper from '@/components/main/DrawerWrapper.vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import ModalWrapper from '@/components/main/ModalWrapper.vue';
import ToastWrapper from '@/components/main/ToastWrapper.vue';
import OverlayWait from '@/components/main/OverlayWait.vue';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

export default {
  name: 'App',
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

    const computedScope = {
      resolvedProjectSlug: computed(() => {
        return route.params.projectSlug || route.query.project || env.projectSlug || '';
      }),
      isProjectBootLoading: computed(() => {
        if (!computedScope.resolvedProjectSlug.value) {
          return false;
        }

        if (projectStore.isRejected && projectStore.projectSlug === computedScope.resolvedProjectSlug.value) {
          return false;
        }

        if (projectStore.projectSlug !== computedScope.resolvedProjectSlug.value) {
          return true;
        }

        if (projectStore.isFetching && !projectStore.isFulfilled) {
          return true;
        }

        if (tableStore.lastLoadedProjectSlug !== computedScope.resolvedProjectSlug.value) {
          return true;
        }

        return !tableStore.hasLoadedInitialPage && !tableStore.isRejectedPage;
      }),
      isProjectBootReady: computed(() => !computedScope.isProjectBootLoading.value),
      pageClasses: computed(() => ({
        'app-shell-page--ready': computedScope.isProjectBootReady.value
      }))
    };

    return {
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/app/App.scss" lang="scss"></style>
