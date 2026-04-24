<template>
  <keep-alive include="PageMap,PageTable">
    <component :is="activePageComponent" />
  </keep-alive>
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

    const computedState = {
      activePageComponent: computed(() => {
        return navigationStore.activePage === 'map' ? PageMap : PageTable;
      })
    };

    return {
      ...computedState
    };
  }
};
</script>
