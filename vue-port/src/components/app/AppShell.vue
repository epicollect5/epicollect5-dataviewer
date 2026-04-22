<template>
  <ion-app>
    <DrawerWrapper />
    <ion-page id="app-shell-content" class="app-shell-page" :class="{ 'app-shell-page--ready': !isProjectBootLoading }">
      <AppHeader v-if="!isProjectBootLoading" />
      <ion-content fullscreen>
        <router-view v-slot="{ Component }">
          <keep-alive include="PageMap,PageTable">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </ion-content>
      <AppToastHost />
      <AppModalHost />
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
import AppHeader from '@/components/app/AppHeader.vue';
import DrawerWrapper from '@/components/app/DrawerWrapper.vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import AppModalHost from '@/components/app/ModalAppHost.vue';
import AppToastHost from '@/components/app/ToastAppHost.vue';
import OverlayWait from '@/components/app/OverlayWait.vue';
import { useMapStore } from '@/stores/mapStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

export default {
  name: 'AppShell',
  components: {
    IonApp,
    IonContent,
    IonPage,
    AppHeader,
    DrawerWrapper,
    LoaderSpinner,
    AppModalHost,
    AppToastHost,
    OverlayWait
  },
  setup() {
    const route = useRoute();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();
    const mapStore = useMapStore();

    const resolvedProjectSlug = computed(() => {
      return route.params.projectSlug || route.query.project || env.projectSlug || '';
    });

    const isMapRoute = computed(() => route.path.includes('/map'));

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

        if (isMapRoute.value) {
          if (mapStore.lastLoadedProjectSlug !== resolvedProjectSlug.value) {
            return true;
          }

          return !mapStore.hasLoadedInitialPage && !mapStore.isRejectedPage;
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
<style src="@/theme/app/AppShell.scss" lang="scss"></style>
