<template>
  <section class="page-data">
    <div class="page-data__panel" :class="{ 'page-data__panel--active': !isMapPage }" :aria-hidden="isMapPage">
      <PageTable />
    </div>

    <div class="page-data__panel" :class="{ 'page-data__panel--active': isMapPage }" :aria-hidden="!isMapPage">
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
      isMapPage: computed(() => navigationStore.activePage === 'map')
    };

    return {
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/pages/PageData.scss" lang="scss"></style>
