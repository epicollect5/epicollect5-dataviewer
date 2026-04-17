<template>
  <div class="app-drawer" :class="{ 'app-drawer--open': activeDrawer !== null }">
    <button
      v-if="activeDrawer !== null"
      class="app-drawer__backdrop"
      type="button"
      aria-label="Close drawer"
      @click="drawerStore.close()"
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
        <ion-button fill="clear" color="primary" class="app-drawer__close-icon" aria-label="Close drawer" @click="drawerStore.close()">
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

<script setup>
import { IonButton, IonIcon } from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import DrawerEntry from '@/components/entry/DrawerEntry.vue';
import MapControls from '@/components/map/MapControls.vue';
import { useDrawerStore } from '@/stores/drawerStore';

const drawerStore = useDrawerStore();
const { activeDrawer, payload } = storeToRefs(drawerStore);

const drawerTitle = computed(() => {
  if (activeDrawer.value === 'map-entry') {
    return 'Entry';
  }

  if (activeDrawer.value === 'map-filters') {
    return 'Map Filters';
  }

  return 'Drawer';
});

const drawerSide = computed(() => payload.value?.side || 'right');

const forward = (eventName, value) => {
  payload.value?.onEvent?.(eventName, value);
};
</script>
