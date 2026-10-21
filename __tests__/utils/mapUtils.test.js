import PARAMETERS from 'config/parameters';

//mapUtils reads the global leaflet at module scope, so the module has to be
//required after the stub is in place
describe('map utils test', () => {

    let mapUtils;
    let randomSpy;

    beforeEach(() => {
        jest.resetModules();

        global.window.L = {
            circleMarker: jest.fn(() => ({ bindPopup: jest.fn() })),
            latLng: jest.fn((lat, lng) => ({ lat, lng })),
            DivIcon: jest.fn((options) => options),
            Point: jest.fn((x, y) => ({ x, y }))
        };

        mapUtils = require('utils/mapUtils').default;
    });

    afterEach(() => {
        if (randomSpy) {
            randomSpy.mockRestore();
            randomSpy = null;
        }
    });

    describe('getMarkers', () => {

        const entries = [
            {
                geometry: { type: 'Point', coordinates: [9.19, 45.46] },
                properties: { uuid: 'entry-uuid-1', title: 'Entry title 1', possible_answers: { 'ref-a': 'A' } }
            },
            {
                geometry: { type: 'Point', coordinates: [10.19, 46.46] },
                properties: { uuid: 'entry-uuid-2', title: 'Entry title 2', possible_answers: {} }
            }
        ];

        it('should build a marker for every entry', () => {
            const { markerList } = mapUtils.getMarkers(entries, null);

            expect(markerList).toHaveLength(2);
            expect(global.window.L.circleMarker).toHaveBeenCalledTimes(2);
        });

        it('should flip the coordinates into latitude and longitude', () => {
            const { latLongs } = mapUtils.getMarkers(entries, null);

            expect(latLongs).toEqual([[45.46, 9.19], [46.46, 10.19]]);
        });

        it('should find the marker to restore by uuid', () => {
            const { markerList, markerToRestore } = mapUtils.getMarkers(entries, 'entry-uuid-2');

            expect(markerToRestore).toBe(markerList[1]);
        });

        it('should not restore any marker when the uuid is not there', () => {
            const { markerToRestore } = mapUtils.getMarkers(entries, 'not-an-entry-uuid');

            expect(markerToRestore).toBe(null);
        });
    });

    describe('getDatesRange', () => {

        it('should return one step per day', () => {
            const range = mapUtils.getDatesRange(new Date(2018, 0, 1), new Date(2018, 0, 5));

            expect(range).toHaveLength(5);
            expect(range.map((date) => date.getDate())).toEqual([1, 2, 3, 4, 5]);
        });

        it('should return a single day for a same day range', () => {
            const range = mapUtils.getDatesRange(new Date(2018, 0, 1), new Date(2018, 0, 1));

            expect(range).toHaveLength(1);
            expect(range[0].getDate()).toBe(1);
        });
    });

    describe('getMaxRadius', () => {

        const buildEntries = (count) => {
            const entries = [];
            for (let i = 0; i < count; i++) {
                entries.push({ id: i });
            }
            return entries;
        };

        it('should scale the radius with the number of entries', () => {
            //11 * the first digit * the number of digits
            expect(mapUtils.getMaxRadius(buildEntries(0))).toBe(0);
            expect(mapUtils.getMaxRadius(buildEntries(1))).toBe(11);
            expect(mapUtils.getMaxRadius(buildEntries(9))).toBe(99);
            expect(mapUtils.getMaxRadius(buildEntries(10))).toBe(22);
            expect(mapUtils.getMaxRadius(buildEntries(100))).toBe(33);
        });
    });

    describe('getFilteredEntries', () => {

        const entries = [
            { properties: { created_at: '2018-01-01T10:00:00.000Z' } },
            { properties: { created_at: '2018-01-03T10:00:00.000Z' } },
            { properties: { created_at: '2018-01-05T10:00:00.000Z' } }
        ];

        it('should include the entries on both boundaries', () => {
            const filtered = mapUtils.getFilteredEntries(entries, new Date(2018, 0, 1), new Date(2018, 0, 3));

            expect(filtered).toHaveLength(2);
            expect(filtered[0].properties.created_at).toBe('2018-01-01T10:00:00.000Z');
            expect(filtered[1].properties.created_at).toBe('2018-01-03T10:00:00.000Z');
        });

        it('should filter out the entries outside of the range', () => {
            const filtered = mapUtils.getFilteredEntries(entries, new Date(2018, 0, 2), new Date(2018, 0, 4));

            expect(filtered).toHaveLength(1);
            expect(filtered[0].properties.created_at).toBe('2018-01-03T10:00:00.000Z');
        });
    });

    describe('createClusterIcon', () => {

        const buildCluster = (childCount) => {
            return { getChildCount: () => childCount };
        };

        it('should build a small icon for less than 10 children', () => {
            const icon = mapUtils.createClusterIcon(buildCluster(5));

            expect(icon.className).toBe('marker-cluster marker-cluster-small');
            expect(icon.iconSize).toEqual({ x: 40, y: 40 });
        });

        it('should build a medium icon for less than 100 children', () => {
            const icon = mapUtils.createClusterIcon(buildCluster(50));

            expect(icon.className).toBe('marker-cluster marker-cluster-medium');
            expect(icon.iconSize).toEqual({ x: 40, y: 40 });
        });

        it('should build a large icon for 100 children and more', () => {
            const icon = mapUtils.createClusterIcon(buildCluster(500));

            expect(icon.className).toBe('marker-cluster marker-cluster-large');
            expect(icon.iconSize).toEqual({ x: 40, y: 40 });
        });

        it('should use a bigger point size above 999 children', () => {
            const icon = mapUtils.createClusterIcon(buildCluster(1000));

            expect(icon.className).toBe('marker-cluster marker-cluster-large');
            expect(icon.iconSize).toEqual({ x: 50, y: 50 });
        });
    });

    describe('getRandomLocation', () => {

        it('should offset the location within the given radius', () => {
            randomSpy = jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.5)
                .mockReturnValueOnce(0.5);

            const location = mapUtils.getRandomLocation(45, 9, 1000);

            //with both randoms at 0.5 the offset is half of the radius, due north
            const expectedOffset = (500 / 6378137) * (180 / Math.PI);
            expect(location.latitude).toBeCloseTo(45 + expectedOffset, 10);
            expect(location.longitude).toBeCloseTo(9, 10);
        });

        it('should keep the offset within the radius', () => {
            randomSpy = jest.spyOn(Math, 'random')
                .mockReturnValueOnce(0.9)
                .mockReturnValueOnce(0.1);

            const location = mapUtils.getRandomLocation(45, 9, 1000);

            const offsetInDegrees = Math.abs(location.latitude - 45);
            const offsetInMeters = offsetInDegrees * 111320;

            expect(offsetInMeters).toBeLessThanOrEqual(1000);
        });
    });
});
