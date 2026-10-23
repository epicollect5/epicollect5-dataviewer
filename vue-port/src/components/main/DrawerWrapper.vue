<template>
  <ion-menu
    menu-id="app-drawer-menu"
    content-id="app-shell-main-content"
    type="overlay"
    :class="drawerClasses"
    :side="drawerSide"
    :disabled="isDrawerDisabled"
    :swipe-gesture="false"
    @ionDidClose="handleMenuDidClose"
  >
    <ion-header>
      <ion-toolbar>
        <div class="drawer-wrapper__header">
          <h2>{{ drawerTitle }}</h2>
          <ion-button fill="clear" color="primary" class="drawer-wrapper__close-icon" aria-label="Close drawer" @click="closeMenu">
            <ion-icon :icon="close" />
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="drawer-wrapper">
      <DrawerEntry v-if="isEntryDrawer" />
      <DrawerMap
        v-else-if="isFiltersDrawer"
        v-bind="drawerPayload"
        @change-location="handleChangeLocation"
        @change-distribution="handleChangeDistribution"
        @reset-distribution="handleResetDistribution"
        @toggle-clusters="handleToggleClusters"
        @update-dates="handleUpdateDates"
        @reset-dates="handleResetDates"
      />
      <DrawerNavbarPrimary
        v-else-if="isNavbarDrawer"
        v-bind="drawerPayload"
        @avatar-error="handleAvatarError"
        @download="handleDownload"
        @navigate-page="handleNavigatePage"
      />
      <DrawerDownload
        v-else-if="isDownloadDrawer"
        v-bind="drawerPayload"
        @download="handleDownload"
      />
    </ion-content>
  </ion-menu>
</template>

<script>
import { IonButton, IonContent, IonHeader, IonIcon, IonMenu, IonToolbar, menuController } from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, onMounted, reactive, watch } from 'vue';
import DrawerDownload from '@/components/main/DrawerDownload.vue';
import DrawerNavbarPrimary from '@/components/main/DrawerNavbarPrimary.vue';
import DrawerEntry from '@/components/entry/DrawerEntry.vue';
import DrawerMap from '@/components/map/DrawerMap.vue';
import { useDrawerStore } from '@/stores/drawerStore';

export default {
  name: 'DrawerWrapper',
  components: {
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenu,
    IonToolbar,
    DrawerDownload,
    DrawerNavbarPrimary,
    DrawerEntry,
    DrawerMap
  },
  setup() {
    const drawerStore = useDrawerStore();

    const state = reactive({
      drawerStore
    });

    const methods = {
      normalizeDrawerSide(side) {
        if (side === 'left') {
          return 'start';
        }

        if (side === 'right') {
          return 'end';
        }

        return side || 'end';
      },
      async syncMenu(activeDrawer) {
        if (activeDrawer) {
          await menuController.enable(true, 'app-drawer-menu');
          await menuController.open('app-drawer-menu');
          return;
        }

        const isOpen = await menuController.isOpen('app-drawer-menu');

        if (isOpen) {
          await menuController.close('app-drawer-menu');
        }

        await menuController.enable(false, 'app-drawer-menu');
      },
      async closeMenu() {
        await menuController.close('app-drawer-menu');
      },
      closeDrawer() {
        drawerStore.close();
      },
      handleMenuDidClose() {
        if (drawerStore.activeDrawer) {
          drawerStore.close();
        }
      },
      forward(eventName, value) {
        const onEvent = drawerStore.payload?.onEvent;

        onEvent?.(eventName, value);
      },
      handleChangeLocation(value) {
        methods.forward('change-location', value);
      },
      handleChangeDistribution(value) {
        methods.forward('change-distribution', value);
      },
      handleResetDistribution() {
        methods.forward('reset-distribution');
      },
      handleToggleClusters(value) {
        methods.forward('toggle-clusters', value);
      },
      handleUpdateDates(value) {
        methods.forward('update-dates', value);
      },
      handleResetDates() {
        methods.forward('reset-dates');
      },
      handleAvatarError() {
        methods.forward('avatar-error');
      },
      handleDownload(value) {
        methods.forward('download', value);
      },
      handleNavigatePage(value) {
        methods.forward('navigate-page', value);
      }
    };

    const computedScope = {
      activeDrawer: computed(() => drawerStore.activeDrawer),
      isDrawerDisabled: computed(() => !drawerStore.activeDrawer),
      isEntryDrawer: computed(() => drawerStore.activeDrawer === 'map-entry'),
      isFiltersDrawer: computed(() => drawerStore.activeDrawer === 'map-filters'),
      isNavbarDrawer: computed(() => drawerStore.activeDrawer === 'navbar-primary'),
      isDownloadDrawer: computed(() => drawerStore.activeDrawer === 'app-download'),
      payload: computed(() => drawerStore.payload),
      drawerPayload: computed(() => {
        if (!drawerStore.payload) {
          return null;
        }

        const { side, ...rest } = drawerStore.payload;
        return rest;
      }),
      drawerTitle: computed(() => {
        if (drawerStore.activeDrawer === 'map-entry') {
          return 'Entry';
        }

        if (drawerStore.activeDrawer === 'map-filters') {
          return 'Map Filters';
        }

        if (drawerStore.activeDrawer === 'navbar-primary') {
          return 'Menu';
        }

        if (drawerStore.activeDrawer === 'app-download') {
          return 'Download';
        }

        return 'Drawer';
      }),
      drawerClasses: computed(() => ({
        'drawer-wrapper--map-filters': drawerStore.activeDrawer === 'map-filters',
        'drawer-wrapper--map-interactive': ['map-filters', 'map-entry'].includes(drawerStore.activeDrawer)
      })),
      drawerSide: computed(() => methods.normalizeDrawerSide(drawerStore.payload?.side))
    };

    onMounted(() => {
      methods.syncMenu(drawerStore.activeDrawer);
    });

    watch(
      () => drawerStore.activeDrawer,
      (activeDrawer) => {
        methods.syncMenu(activeDrawer);
      },
      {
        flush: 'post'
      }
    );

    const icons = {
      close
    };

    return {
      state,
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/app/DrawerWrapper.scss" lang="scss"></style>
