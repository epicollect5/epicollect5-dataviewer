<template>
  <ion-menu
    menu-id="app-drawer-menu"
    content-id="app-shell-content"
    type="overlay"
    :side="drawerSide"
    :disabled="!activeDrawer"
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
      <DrawerEntry v-if="activeDrawer === 'map-entry'" />
      <DrawerMap
        v-else-if="activeDrawer === 'map-filters'"
        v-bind="drawerPayload"
        @change-location="forward('change-location', $event)"
        @toggle-clusters="forward('toggle-clusters', $event)"
        @update-dates="forward('update-dates', $event)"
        @reset-dates="forward('reset-dates')"
      />
      <DrawerNavbarPrimary
        v-else-if="activeDrawer === 'navbar-primary'"
        v-bind="drawerPayload"
        @avatar-error="forward('avatar-error')"
        @download="forward('download')"
        @navigate-page="forward('navigate-page', $event)"
      />
    </ion-content>
  </ion-menu>
</template>

<script>
import { IonButton, IonContent, IonHeader, IonIcon, IonMenu, IonToolbar, menuController } from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, onMounted, reactive, watch } from 'vue';
import DrawerNavbarPrimary from '@/components/app/DrawerNavbarPrimary.vue';
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
        drawerStore.payload?.onEvent?.(eventName, value);
      }
    };

    const computedScope = {
      activeDrawer: computed(() => drawerStore.activeDrawer),
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

        return 'Drawer';
      }),
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

    return {
      state,
      ...methods,
      ...computedScope,
      close
    };
  }
};
</script>
<style src="@/theme/app/DrawerWrapper.scss" lang="scss"></style>
