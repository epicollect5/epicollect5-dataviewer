import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PageMap from '@/pages/PageMap.vue';
import { useDrawerStore } from '@/stores/drawerStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

describe('PageMap smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('opens the filters drawer and loads an entry from marker clicks', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:projectSlug/data/map',
          component: PageMap
        }
      ]
    });

    router.push('/demo/data/map');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const drawerStore = useDrawerStore();
    const mapStore = useMapStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        created_at: '2024-01-01 00:00:00',
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    projectStore.projectExtra = {
      forms: {
        form_1: {
          lists: {
            location_inputs: [{ input_ref: 'location_1', branch_ref: '', question: 'Location' }]
          }
        }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');

    mapStore.selectedLocationQuestion = {
      input_ref: 'location_1',
      branch_ref: '',
      question: 'Location'
    };
    mapStore.locations = [
      {
        geometry: {
          coordinates: [12.5, 41.9]
        },
        properties: {
          uuid: 'entry-1',
          title: 'Entry 1'
        }
      }
    ];
    mapStore.markers = [{ entryUuid: 'entry-1', latitude: 41.9, longitude: 12.5 }];
    mapStore.loadLocations = vi.fn().mockResolvedValue();
    mapStore.loadEntry = vi.fn().mockResolvedValue();

    const wrapper = mount(PageMap, {
      global: {
        plugins: [router, pinia],
        stubs: {
          LeafletMap: {
            template: '<button type="button" class="marker-trigger" @click="$emit(\'marker-click\', { entryUuid: \'entry-1\' })">Marker</button>'
          }
        }
      }
    });

    await flushPromises();

    expect(navigationStore.activePage).toBe('map');
    expect(mapStore.loadLocations).toHaveBeenCalledWith({ resetFilters: true });

    const filtersButton = wrapper.find('button[aria-label="Open filters drawer"]');
    await filtersButton.trigger('click');

    expect(drawerStore.activeDrawer).toBe('map-filters');
    expect(drawerStore.payload.side).toBe('left');
    expect(drawerStore.payload.visibleCount).toBe(1);
    expect(drawerStore.payload.totalCount).toBe(1);
    expect(drawerStore.payload.locationQuestions).toHaveLength(1);

    await wrapper.find('.marker-trigger').trigger('click');

    expect(drawerStore.activeDrawer).toBe('map-entry');
    expect(mapStore.loadEntry).toHaveBeenCalledWith('entry-1');
  });
});
