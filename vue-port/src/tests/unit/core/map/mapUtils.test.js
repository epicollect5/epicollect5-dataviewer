import mapUtils from '@/core/map/mapUtils';

describe('mapUtils', () => {
  it('filters entries by created_at day range', () => {
    const entries = [
      {
        properties: {
          uuid: 'a',
          created_at: '2024-04-10 12:00:00'
        }
      },
      {
        properties: {
          uuid: 'b',
          created_at: '2024-04-15 12:00:00'
        }
      }
    ];

    const filtered = mapUtils.filterLocationsByDate(entries, '2024-04-11', '2024-04-20');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].properties.uuid).toBe('b');
  });

  it('groups markers by coordinates when clustered', () => {
    const entries = [
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

    const { markers, processedCount, totalCount } = mapUtils.buildMarkerItems(entries, true);

    expect(markers).toHaveLength(1);
    expect(markers[0].count).toBe(2);
    expect(processedCount).toBe(2);
    expect(totalCount).toBe(2);
  });

  it('keeps markers separate when clustering is disabled', () => {
    const entries = [
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

    const { markers } = mapUtils.buildMarkerItems(entries, false);

    expect(markers).toHaveLength(2);
    expect(markers[0].count).toBe(1);
    expect(markers[1].count).toBe(1);
  });
});
