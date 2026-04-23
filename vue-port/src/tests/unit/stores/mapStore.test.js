import { setActivePinia, createPinia } from 'pinia';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const { fetchEntriesLocations } = vi.hoisted(() => ({
  fetchEntriesLocations: vi.fn()
}));

vi.mock('@/services/api/entriesApi', () => ({
  fetchEntriesLocations,
  fetchEntry: vi.fn()
}));

describe('mapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchEntriesLocations.mockReset();
  });

  it('rebuilds visible markers when the cluster toggle changes', () => {
    const store = useMapStore();

    store.locations = [
      {
        geometry: {
          coordinates: [12.5, 41.9]
        },
        properties: {
          uuid: 'a',
          title: 'First'
        }
      },
      {
        geometry: {
          coordinates: [12.5, 41.9]
        },
        properties: {
          uuid: 'b',
          title: 'Second'
        }
      }
    ];

    store.recomputeMarkers();
    expect(store.markers).toHaveLength(1);

    store.setClustersEnabled(false);
    expect(store.markers).toHaveLength(2);
  });

  it('applies date filtering before rebuilding markers', () => {
    const store = useMapStore();

    store.locations = [
      {
        geometry: {
          coordinates: [12.5, 41.9]
        },
        properties: {
          uuid: 'a',
          title: 'First',
          created_at: '2024-04-10 12:00:00'
        }
      },
      {
        geometry: {
          coordinates: [13.0, 42.1]
        },
        properties: {
          uuid: 'b',
          title: 'Second',
          created_at: '2024-04-15 12:00:00'
        }
      }
    ];

    store.setDateFilter('2024-04-12', '2024-04-20');

    expect(store.filteredLocations).toHaveLength(1);
    expect(store.filteredLocations[0].properties.uuid).toBe('b');
    expect(store.markers).toHaveLength(1);
  });

  it('reuses the in-flight locations request for the same project and form', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectExtra = {
      forms: {
        form_1: {
          lists: {
            location_inputs: [
              {
                input_ref: 'location_1',
                branch_ref: ''
              }
            ]
          }
        }
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    fetchEntriesLocations.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                data: {
                  geojson: {
                    features: []
                  }
                },
                meta: {},
                links: {}
              }
            });
          }, 0);
        })
    );

    const firstRequest = store.loadLocations({ resetFilters: true });
    const secondRequest = store.loadLocations({ resetFilters: true });

    await Promise.all([firstRequest, secondRequest]);

    expect(fetchEntriesLocations).toHaveBeenCalledTimes(1);
  });
});
