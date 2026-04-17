import { setActivePinia, createPinia } from 'pinia';
import { useMapStore } from '@/stores/mapStore';

describe('mapStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
});
