import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import MapView from '@/pages/PageMap.vue';
import routes from '@/config/routes';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

describe('MapView smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows no location state when current form has no location inputs', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    });

    router.push('/demo/data/map');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
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
            location_inputs: []
          }
        }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    mapStore.loadLocations = vi.fn();

    const wrapper = mount(MapView, {
      global: {
        plugins: [router, pinia]
      }
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No map questions in this form');
  });
});
