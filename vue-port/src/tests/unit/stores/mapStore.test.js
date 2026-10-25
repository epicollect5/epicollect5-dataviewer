import { setActivePinia, createPinia } from 'pinia';
import client from '@/services/api/client';
import { clearEntriesLocationsCache } from '@/services/entries/entriesPageCache';
import { buildDistributionChart } from '@/services/map/distributionChart';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const { fetchEntriesLocations } = vi.hoisted(() => ({
  fetchEntriesLocations: vi.fn()
}));

vi.mock('@/services/api/entriesApi', () => ({
  fetchEntriesLocationsCompact: fetchEntriesLocations,
  fetchEntry: vi.fn()
}));

const setupProjectWithLocation = ({ projectStore, navigationStore }) => {
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
};

describe('stores/mapStore map restore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('applies the saved question, timeframe and distribution once', () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const mapStore = useMapStore();

    setupProjectWithLocation({ projectStore, navigationStore });
    mapStore.setPendingMapRestore({
      selectedLocationQuestion: { input_ref: 'location_1', branch_ref: '', question: 'Where?' },
      selectedDistributionQuestion: { inputRef: 'q1', question: 'Colour' },
      startDate: '2024-01-01',
      endDate: '2024-02-01'
    });

    const mapRestore = mapStore.takePendingMapRestore('form_1');

    expect(mapRestore.selectedLocationQuestion).toEqual({ input_ref: 'location_1', branch_ref: '', question: 'Where?' });
    expect(mapStore.startDate).toBe('2024-01-01');
    expect(mapStore.endDate).toBe('2024-02-01');
    expect(mapStore.selectedDistributionQuestion).toEqual({ inputRef: 'q1', question: 'Colour' });
    //the view is consumed once, so a later plain load does not replay it
    expect(mapStore.pendingMapRestore).toBe(null);
    expect(mapStore.takePendingMapRestore('form_1')).toBe(null);
  });

  it('drops a location question the form no longer has', () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const mapStore = useMapStore();

    setupProjectWithLocation({ projectStore, navigationStore });
    mapStore.setPendingMapRestore({
      selectedLocationQuestion: { input_ref: 'location_removed', branch_ref: '', question: 'Old question' },
      startDate: '',
      endDate: ''
    });

    expect(mapStore.takePendingMapRestore('form_1')).toEqual({ selectedLocationQuestion: null });
  });
});

const compactLocationPayload = ({
  points = [],
  paMap = ['answer_1', 'answer_2'],
  meta = {},
  links = {}
} = {}) => ({
  data: {
    input_ref: 'location_1',
    pa_map: paMap,
    points
  },
  meta: {
    total: points.length,
    current_page: 1,
    last_page: 1,
    per_page: 25000,
    per_chunk: 5000,
    chunk_page: 1,
    chunk_last_page: 1,
    ...meta
  },
  links: {
    self: 'https://five.epicollect.net/api/internal/entries-locations-compact/demo-project?form_ref=form_1&input_ref=location_1&page=1',
    prev: null,
    next: null,
    ...links
  }
});

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

  it('recomputes visible locations when the cluster toggle changes', () => {
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
    expect(store.markers).toHaveLength(2);

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

    setupProjectWithLocation({ projectStore, navigationStore });
    fetchEntriesLocations.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: compactLocationPayload()
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

    setupProjectWithLocation({ projectStore, navigationStore });
    const pageOneUrl = 'https://five.epicollect.net/api/internal/entries-locations-compact/demo-project?form_ref=form_1&input_ref=location_1&page=1';
    const pageTwoUrl = 'https://five.epicollect.net/api/internal/entries-locations-compact/demo-project?form_ref=form_1&input_ref=location_1&page=2';
    const clientGetSpy = vi.spyOn(client, 'get').mockResolvedValue({
      data: compactLocationPayload({
        points: [
          {
            u: 'entry-2',
            x: 13.5,
            y: 42.9,
            d: 20240415,
            pa: [1]
          }
        ],
        meta: {
          total: 2,
          current_page: 2,
          last_page: 2,
          chunk_page: 1,
          chunk_last_page: 1
        },
        links: {
          self: pageTwoUrl,
          prev: pageOneUrl,
          next: null
        }
      })
    });

    fetchEntriesLocations.mockResolvedValue({
      data: compactLocationPayload({
        points: [
          {
            u: 'entry-1',
            x: 12.5,
            y: 41.9,
            d: 20240410,
            pa: [0]
          }
        ],
        meta: {
          total: 2,
          current_page: 1,
          last_page: 2,
          chunk_page: 1,
          chunk_last_page: 1
        },
        links: {
          self: pageOneUrl,
          prev: null,
          next: pageTwoUrl
        }
      })
    });

    await store.loadLocations({ resetFilters: true });
    await store.loadLocations({ pageUrl: pageTwoUrl });
    await store.loadLocations({ pageUrl: pageOneUrl });
    await store.loadLocations({ pageUrl: pageTwoUrl });

    expect(fetchEntriesLocations).toHaveBeenCalledTimes(1);
    expect(clientGetSpy).toHaveBeenCalledTimes(1);
    expect(store.isFetchingPage).toBe(false);
    expect(store.locations).toHaveLength(1);
    expect(store.locations[0].u).toBe('entry-2');
  });

  it('keeps the loaded form when paging after a restore moved the current form', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();
    const pageTwoUrl = 'https://five.epicollect.net/api/internal/entries-locations-compact/demo-project?form_ref=form_1&input_ref=location_1&page=2';

    projectStore.projectSlug = 'demo-project';
    projectStore.projectExtra = {
      forms: {
        form_1: {
          lists: {
            location_inputs: [{ input_ref: 'location_1', branch_ref: '' }]
          }
        },
        form_2: {
          lists: {
            location_inputs: []
          }
        }
      }
    };
    projectStore.projectDefinition = {
      project: {
        forms: [
          { ref: 'form_1', name: 'Form One' },
          { ref: 'form_2', name: 'Form Two' }
        ]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    fetchEntriesLocations.mockResolvedValue({
      data: compactLocationPayload({
        points: [{ u: 'entry-1', x: 12.5, y: 41.9, d: 20240410, pa: [0] }]
      })
    });

    await store.loadLocations({ resetFilters: true });

    //the table restored a child view, while the map holds the parent form locations
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    vi.spyOn(client, 'get').mockResolvedValue({
      data: compactLocationPayload({
        points: [{ u: 'entry-2', x: 13.5, y: 42.9, d: 20240415, pa: [0] }],
        links: {
          self: pageTwoUrl,
          prev: null,
          next: null
        }
      })
    });

    await store.loadLocations({ pageUrl: pageTwoUrl });

    expect(store.lastLoadedFormRef).toBe('form_1');
    expect(store.isRejectedPage).toBe(false);
    expect(store.locations).toHaveLength(1);
    expect(store.locations[0].u).toBe('entry-2');
  });

  it('loads a single compact chunk without rebuilding GeoJSON features', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();

    setupProjectWithLocation({ projectStore, navigationStore });
    fetchEntriesLocations.mockResolvedValue({
      data: compactLocationPayload({
        points: [
          {
            u: 'entry-1',
            x: -0.118092,
            y: 51.509865,
            d: 20260515,
            pa: [0, 2]
          }
        ],
        paMap: ['answer_1', 'answer_2', 'answer_3'],
        meta: {
          total: 1,
          chunk_last_page: 1
        }
      })
    });

    await store.loadLocations({ resetFilters: true });

    expect(fetchEntriesLocations).toHaveBeenCalledWith('demo-project', {
      form_ref: 'form_1',
      input_ref: 'location_1'
    });
    expect(store.locations).toEqual([
      {
        u: 'entry-1',
        x: -0.118092,
        y: 51.509865,
        d: 20260515,
        pa: [0, 2]
      }
    ]);
    expect(store.possibleAnswerMap).toEqual(['answer_1', 'answer_2', 'answer_3']);
  });

  it('loads only the compact chunks for the current map page and merges them in chunk order', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();
    const pendingChunks = {};

    setupProjectWithLocation({ projectStore, navigationStore });
    fetchEntriesLocations.mockImplementation((projectSlug, params = {}) => {
      const page = params.page || 1;

      if (page === 1) {
        return Promise.resolve({
          data: compactLocationPayload({
            points: [{ u: 'entry-1', x: 10, y: 20, d: 20260513, pa: [0] }],
            meta: {
              per_page: 25000,
              per_chunk: 5000,
              chunk_page: 1,
              chunk_last_page: 10,
              total: 50000
            }
          })
        });
      }

      return new Promise((resolve) => {
        pendingChunks[page] = resolve;
      });
    });

    const loadPromise = store.loadLocations({ resetFilters: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchEntriesLocations).toHaveBeenCalledTimes(5);
    expect(fetchEntriesLocations).toHaveBeenNthCalledWith(2, 'demo-project', {
      form_ref: 'form_1',
      input_ref: 'location_1',
      page: 2
    });
    expect(fetchEntriesLocations).toHaveBeenNthCalledWith(3, 'demo-project', {
      form_ref: 'form_1',
      input_ref: 'location_1',
      page: 3
    });
    expect(fetchEntriesLocations).toHaveBeenNthCalledWith(4, 'demo-project', {
      form_ref: 'form_1',
      input_ref: 'location_1',
      page: 4
    });
    expect(fetchEntriesLocations).toHaveBeenNthCalledWith(5, 'demo-project', {
      form_ref: 'form_1',
      input_ref: 'location_1',
      page: 5
    });

    pendingChunks[5]({
      data: compactLocationPayload({
        points: [{ u: 'entry-5', x: 50, y: 60, d: 20260517, pa: [1] }],
        meta: {
          chunk_page: 5,
          chunk_last_page: 10
        }
      })
    });
    pendingChunks[4]({
      data: compactLocationPayload({
        points: [{ u: 'entry-4', x: 40, y: 50, d: 20260516, pa: [0] }],
        meta: {
          chunk_page: 4,
          chunk_last_page: 10
        }
      })
    });
    pendingChunks[3]({
      data: compactLocationPayload({
        points: [{ u: 'entry-3', x: 30, y: 40, d: 20260515, pa: [1] }],
        meta: {
          chunk_page: 3,
          chunk_last_page: 10
        }
      })
    });
    pendingChunks[2]({
      data: compactLocationPayload({
        points: [{ u: 'entry-2', x: 20, y: 30, d: 20260514, pa: [0, 1] }],
        meta: {
          chunk_page: 2,
          chunk_last_page: 10
        }
      })
    });

    await loadPromise;

    expect(store.locations.map((location) => location.u)).toEqual(['entry-1', 'entry-2', 'entry-3', 'entry-4', 'entry-5']);
    expect(store.locations[1].pa).toEqual([0, 1]);
    expect(store.pagination).toMatchObject({
      current_page: 1,
      last_page: 2,
      chunk_page: 1,
      chunk_to: 5,
      chunk_last_page: 10
    });
    expect(store.links.next).toContain('page=6');
  });

  it('loads the next compact chunk range for map page two', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();
    const pageTwoUrl = 'https://five.epicollect.net/api/internal/entries-locations-compact/demo-project?form_ref=form_1&input_ref=location_1&page=6';
    const clientGetSpy = vi.spyOn(client, 'get').mockImplementation((url) => {
      const page = Number(new URL(url).searchParams.get('page')) || 6;

      return Promise.resolve({
        data: compactLocationPayload({
          points: [{ u: `entry-${page}`, x: page, y: page + 1, d: 20260515, pa: [0] }],
          meta: {
            total: 50000,
            per_page: 25000,
            per_chunk: 5000,
            current_page: 1,
            last_page: 2,
            chunk_page: page,
            chunk_last_page: 10
          },
          links: {
            self: url
          }
        })
      });
    });

    setupProjectWithLocation({ projectStore, navigationStore });
    store.requestParams = {
      form_ref: 'form_1',
      input_ref: 'location_1'
    };

    await store.loadLocations({ pageUrl: pageTwoUrl });

    expect(clientGetSpy).toHaveBeenCalledTimes(5);
    expect(clientGetSpy.mock.calls.map(([url]) => Number(new URL(url).searchParams.get('page')))).toEqual([6, 7, 8, 9, 10]);
    expect(store.locations.map((location) => location.u)).toEqual(['entry-6', 'entry-7', 'entry-8', 'entry-9', 'entry-10']);
    expect(store.pagination).toMatchObject({
      current_page: 2,
      last_page: 2,
      chunk_page: 6,
      chunk_to: 10
    });
    expect(store.links.prev).toContain('page=1');
    expect(store.links.next).toBeNull();
  });

  it('rejects compact chunks with an unstable possible-answer map', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();

    setupProjectWithLocation({ projectStore, navigationStore });
    fetchEntriesLocations
      .mockResolvedValueOnce({
        data: compactLocationPayload({
          points: [{ u: 'entry-1', x: 10, y: 20, d: 20260513, pa: [0] }],
          paMap: ['answer_1', 'answer_2'],
          meta: {
            chunk_page: 1,
            chunk_last_page: 2
          }
        })
      })
      .mockResolvedValueOnce({
        data: compactLocationPayload({
          points: [{ u: 'entry-2', x: 20, y: 30, d: 20260514, pa: [0] }],
          paMap: ['answer_2', 'answer_1'],
          meta: {
            chunk_page: 2,
            chunk_last_page: 2
          }
        })
      });

    await store.loadLocations({ resetFilters: true });

    expect(store.isRejectedPage).toBe(true);
    expect(store.errors).toEqual(['Compact location possible-answer map mismatch on chunk 2']);
    expect(store.locations).toHaveLength(0);
  });

  it('does not let stale compact responses replace newer map state', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();
    let resolveFirstRequest;

    setupProjectWithLocation({ projectStore, navigationStore });
    projectStore.projectExtra.forms.form_1.lists.location_inputs.push({
      input_ref: 'location_2',
      branch_ref: ''
    });

    fetchEntriesLocations.mockImplementation((projectSlug, params = {}) => {
      if (params.input_ref === 'location_1') {
        return new Promise((resolve) => {
          resolveFirstRequest = resolve;
        });
      }

      return Promise.resolve({
        data: compactLocationPayload({
          points: [{ u: 'fresh-entry', x: 30, y: 40, d: 20260515, pa: [1] }],
          meta: {
            chunk_last_page: 1
          }
        })
      });
    });

    const staleRequest = store.loadLocations({ resetFilters: true });
    const freshRequest = store.loadLocations({
      selectedLocationQuestion: {
        input_ref: 'location_2',
        branch_ref: ''
      },
      resetFilters: true
    });

    await freshRequest;

    resolveFirstRequest({
      data: compactLocationPayload({
        points: [{ u: 'stale-entry', x: 10, y: 20, d: 20260513, pa: [0] }],
        meta: {
          chunk_last_page: 1
        }
      })
    });
    await staleRequest;

    expect(store.locations.map((location) => location.u)).toEqual(['fresh-entry']);
    expect(store.selectedLocationQuestion.input_ref).toBe('location_2');
  });

  it('keeps possible-answer filtering correct after compact decoding', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const store = useMapStore();

    setupProjectWithLocation({ projectStore, navigationStore });
    fetchEntriesLocations.mockResolvedValue({
      data: compactLocationPayload({
        points: [
          { u: 'entry-1', x: 10, y: 20, d: 20260513, pa: [0] },
          { u: 'entry-2', x: 20, y: 30, d: 20260514, pa: [1] },
          { u: 'entry-3', x: 30, y: 40, d: 20260515, pa: [0, 1] }
        ],
        paMap: ['answer_yes', 'answer_no']
      })
    });

    await store.loadLocations({ resetFilters: true });

    expect(buildDistributionChart({
      entries: store.locations,
      legend: [
        {
          answerRef: 'answer_yes',
          answer: 'Yes',
          color: '#000000'
        },
        {
          answerRef: 'answer_no',
          answer: 'No',
          color: '#ffffff'
        }
      ],
      selectedDistributionQuestion: {
        inputRef: 'choice_1'
      },
      possibleAnswerMap: store.possibleAnswerMap
    })).toEqual({
      total: 4,
      rows: [
        {
          answerRef: 'answer_yes',
          answer: 'Yes',
          color: '#000000',
          total: 2
        },
        {
          answerRef: 'answer_no',
          answer: 'No',
          color: '#ffffff',
          total: 2
        }
      ]
    });
  });
});
