<template>
  <section class="page-data">
    <div class="page-data__panel" :class="tablePanelClasses" :aria-hidden="isMapPage">
      <PageTable />
    </div>

    <div class="page-data__panel" :class="mapPanelClasses" :aria-hidden="!isMapPage">
      <PageMap />
    </div>
  </section>
</template>

<script>
import { computed } from 'vue';
import PageMap from '@/pages/PageMap.vue';
import PageTable from '@/pages/PageTable.vue';
import { useNavigationStore } from '@/stores/navigationStore';

export default {
  name: 'PageData',
  components: {
    PageMap,
    PageTable
  },
  setup() {
    const navigationStore = useNavigationStore();

    const computedScope = {
      isMapPage: computed(() => navigationStore.activePage === 'map'),
      tablePanelClasses: computed(() => ({
        'page-data__panel--active': navigationStore.activePage !== 'map'
      })),
      mapPanelClasses: computed(() => ({
        'page-data__panel--active': navigationStore.activePage === 'map'
      }))
    };

    return {
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/pages/PageData.scss" lang="scss"></style>
