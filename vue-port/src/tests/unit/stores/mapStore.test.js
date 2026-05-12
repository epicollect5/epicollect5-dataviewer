import { setActivePinia, createPinia } from 'pinia';
import client from '@/services/api/client';
import { clearEntriesLocationsCache } from '@/services/entries/entriesPageCache';
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
    clearEntriesLocationsCache();
    fetchEntriesLocations.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearEntriesLocationsCache();
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

  it('reuses cached locations for the same project and request url', async () => {
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
    const pageOneUrl = 'https://five.epicollect.net/api/internal/entries-locations/demo-project?form_ref=form_1&input_ref=location_1&page=1';
    const pageTwoUrl = 'https://five.epicollect.net/api/internal/entries-locations/demo-project?form_ref=form_1&input_ref=location_1&page=2';
    const clientGetSpy = vi.spyOn(client, 'get').mockResolvedValue({
      data: {
        data: {
          geojson: {
            features: [
              {
                geometry: {
                  coordinates: [13.5, 42.9]
                },
                properties: {
                  uuid: 'entry-2',
                  title: 'Second map page entry'
                }
              }
            ]
          }
        },
        meta: {
          total: 2,
          current_page: 2,
          last_page: 2
        },
        links: {
          self: pageTwoUrl,
          prev: pageOneUrl,
          next: null
        }
      }
    });

    fetchEntriesLocations.mockResolvedValue({
      data: {
        data: {
          geojson: {
            features: [
              {
                geometry: {
                  coordinates: [12.5, 41.9]
                },
                properties: {
                  uuid: 'entry-1',
                  title: 'Cached map entry'
                }
              }
            ]
          }
        },
        meta: {
          total: 2,
          current_page: 1,
          last_page: 2
        },
        links: {
          self: pageOneUrl,
          prev: null,
          next: pageTwoUrl
        }
      }
    });

    await store.loadLocations({ resetFilters: true });
    await store.loadLocations({ pageUrl: pageTwoUrl });
    await store.loadLocations({ pageUrl: pageOneUrl });

    expect(fetchEntriesLocations).toHaveBeenCalledTimes(1);
    expect(clientGetSpy).toHaveBeenCalledTimes(1);
    expect(store.isFetchingPage).toBe(false);
    expect(store.locations).toHaveLength(1);
    expect(store.locations[0].properties.title).toBe('Cached map entry');
  });
});
