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
          path: '/project/:projectSlug?/data',
          component: PageMap
        }
      ]
    });

    router.push('/project/demo/data');
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
            location_inputs: [{ input_ref: 'location_1', branch_ref: '', question: 'Location' }],
            multiple_choice_inputs: {
              form: {
                order: ['choice_1'],
                choice_1: {
                  possible_answers: {
                    answer_1: 'Yes',
                    answer_2: 'No'
                  }
                }
              },
              branch: {}
            }
          }
        }
      },
      inputs: {
        choice_1: {
          data: {
            question: 'Choice'
          }
        }
      }
    };

    navigationStore.setActivePage('map');
    navigationStore.setCurrentForm('form_1', 'Form 1');
    mapStore.selectedLocationQuestion = {
      input_ref: 'location_1',
      branch_ref: '',
      question: 'Location'
    };
    mapStore.selectedDistributionQuestion = {
      inputRef: 'choice_1',
      question: 'Choice',
      possibleAnswersHashMap: {
        answer_1: 'Yes',
        answer_2: 'No'
      }
    };
    mapStore.locations = [
      {
        geometry: {
          coordinates: [12.5, 41.9]
        },
        properties: {
          uuid: 'entry-1',
          title: 'Entry 1',
          possible_answers: {
            answer_1: 1
          }
        }
      }
    ];
    mapStore.markers = [{ entryUuid: 'entry-1', latitude: 41.9, longitude: 12.5 }];
    mapStore.pagination = {
      total: 50001,
      current_page: 1,
      last_page: 3
    };
    mapStore.links = {
      prev: null,
      next: 'https://five.epicollect.net/api/internal/entries-locations/demo?form_ref=form_1&page=2'
    };
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
    expect(wrapper.text()).toContain('Total 50001 | Page 1/3');

    await wrapper.get('button[aria-label="Next page"]').trigger('click');

    expect(mapStore.loadLocations).toHaveBeenCalledWith({
      pageUrl: 'https://five.epicollect.net/api/internal/entries-locations/demo?form_ref=form_1&page=2'
    });

    const filtersButton = wrapper.find('button[aria-label="Open filters drawer"]');
    await filtersButton.trigger('click');

    expect(drawerStore.activeDrawer).toBe('map-filters');
    expect(drawerStore.payload.side).toBe('left');
    expect(drawerStore.payload.visibleCount).toBe(1);
    expect(drawerStore.payload.totalCount).toBe(1);
    expect(drawerStore.payload.locationQuestions).toHaveLength(1);
    expect(drawerStore.payload.distributionQuestions).toEqual([
      {
        inputRef: 'choice_1',
        question: 'Choice',
        possibleAnswersHashMap: {
          answer_1: 'Yes',
          answer_2: 'No'
        }
      }
    ]);
    expect(drawerStore.payload.distributionChart).toEqual({
      total: 1,
      rows: [
        {
          answerRef: 'answer_1',
          answer: 'Yes',
          color: expect.stringMatching(/^#[0-9A-F]{6}$/),
          total: 1
        },
        {
          answerRef: 'answer_2',
          answer: 'No',
          color: expect.stringMatching(/^#[0-9A-F]{6}$/),
          total: 0
        }
      ]
    });

    await wrapper.find('.marker-trigger').trigger('click');

    expect(drawerStore.activeDrawer).toBe('map-entry');
    expect(mapStore.loadEntry).toHaveBeenCalledWith('entry-1');
  });
});
