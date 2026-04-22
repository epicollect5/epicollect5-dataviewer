<template>
  <div class="app-drawer" :class="{ 'app-drawer--open': activeDrawer !== null }">
    <button
      v-if="activeDrawer !== null"
      class="app-drawer__backdrop"
      type="button"
      aria-label="Close drawer"
      @click="closeDrawer"
    ></button>

    <aside
      v-if="activeDrawer !== null"
      class="app-drawer__panel"
      :class="{
        'app-drawer__panel--left': drawerSide === 'left',
        'app-drawer__panel--right': drawerSide !== 'left'
      }"
    >
      <header class="app-drawer__header">
        <h2>{{ drawerTitle }}</h2>
        <ion-button fill="clear" color="primary" class="app-drawer__close-icon" aria-label="Close drawer" @click="closeDrawer">
          <ion-icon :icon="close" />
        </ion-button>
      </header>

      <div class="app-drawer__content">
        <DrawerEntry v-if="activeDrawer === 'map-entry'" />
        <MapControls
          v-else-if="activeDrawer === 'map-filters'"
          v-bind="payload"
          @change-location="forward('change-location', $event)"
          @toggle-clusters="forward('toggle-clusters', $event)"
          @update-dates="forward('update-dates', $event)"
          @reset-dates="forward('reset-dates')"
        />
      </div>
    </aside>
  </div>
</template>

<script>
import { IonButton, IonIcon } from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, reactive } from 'vue';
import DrawerEntry from '@/components/entry/DrawerEntry.vue';
import MapControls from '@/components/map/MapControls.vue';
import { useDrawerStore } from '@/stores/drawerStore';

export default {
  name: 'DrawerAppHost',
  components: {
    IonButton,
    IonIcon,
    DrawerEntry,
    MapControls
  },
  setup() {
    const drawerStore = useDrawerStore();

    const state = reactive({
      drawerStore
    });

    const methods = {
      closeDrawer() {
        drawerStore.close();
      },
      forward(eventName, value) {
        drawerStore.payload?.onEvent?.(eventName, value);
      }
    };

    const computedState = {
      activeDrawer: computed(() => drawerStore.activeDrawer),
      payload: computed(() => drawerStore.payload),
      drawerTitle: computed(() => {
        if (drawerStore.activeDrawer === 'map-entry') {
          return 'Entry';
        }

        if (drawerStore.activeDrawer === 'map-filters') {
          return 'Map Filters';
        }

        return 'Drawer';
      }),
      drawerSide: computed(() => drawerStore.payload?.side || 'right')
    };

    return {
      state,
      ...methods,
      ...computedState,
      close
    };
  }
};
</script>
