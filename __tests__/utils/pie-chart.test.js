import pieChart from 'utils/pie-chart';
import PARAMETERS from 'config/parameters';

//jsdom 11 does not implement XMLSerializer, so a minimal one is provided
if (typeof global.XMLSerializer === 'undefined') {
    global.XMLSerializer = class XMLSerializer {
        serializeToString(node) {
            return node.outerHTML;
        }
    };
}

const legend = [
    { color: '#111111', answerRef: 'ref-a', answer: 'Answer A' },
    { color: '#222222', answerRef: 'ref-b', answer: 'Answer B' }
];

describe('pie chart utils test', () => {

    describe('calculateSectors', () => {

        it('should calculate a sector per answer', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);

            expect(sectors).toHaveLength(2);
            expect(sectors[0].percentage).toBe(0.25);
            expect(sectors[1].percentage).toBe(0.75);
        });

        it('should make the percentages add up to 1', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);

            const total = sectors.reduce((sum, sector) => sum + sector.percentage, 0);
            expect(total).toBe(1);
        });

        it('should take the color of the legend', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);

            expect(sectors[0].color).toBe('#111111');
            expect(sectors[1].color).toBe('#222222');
        });

        it('should flip the arc sweep over the 180 degrees boundary', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);

            expect(sectors[0].arcSweep).toBe(0);
            expect(sectors[1].arcSweep).toBe(1);
        });

        it('should accumulate the rotation angle', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);

            expect(sectors[0].R).toBe(0);
            expect(sectors[1].R).toBe(90);
        });

        it('should use 0.9999 for a full circle', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 4 }, 4, 40, legend);

            expect(sectors[0].percentage).toBe(0.9999);
        });

        it('should use 0 for an answer with no entries', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 0, 'ref-b': 4 }, 4, 40, legend);

            expect(sectors[0].percentage).toBe(0);
        });
    });

    describe('getPieChartLegend', () => {

        it('should build one entry per possible answer', () => {
            const entries = pieChart.getPieChartLegend({
                possibleAnswersHashMap: { 'ref-a': 'Answer A', 'ref-b': 'Answer B' }
            });

            expect(entries).toHaveLength(2);
            expect(entries[0].answerRef).toBe('ref-a');
            expect(entries[0].answer).toBe('Answer A');
            expect(entries[1].answerRef).toBe('ref-b');
        });

        it('should build a hex color for every entry', () => {
            const entries = pieChart.getPieChartLegend({
                possibleAnswersHashMap: { 'ref-a': 'Answer A' }
            });

            expect(entries[0].color).toMatch(/^#[0-9A-F]{6}$/);
        });
    });

    describe('getRandomColor', () => {

        it('should build a deterministic color', () => {
            const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

            expect(pieChart.getRandomColor()).toBe('#888888');

            randomSpy.mockRestore();
        });
    });

    describe('getClusterPieChartSVG', () => {

        it('should build an svg with the sector fills and rotations', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);
            const svg = pieChart.getClusterPieChartSVG(40, sectors, 4);

            expect(svg).toContain('<svg');
            expect(svg).toContain('fill="#111111"');
            expect(svg).toContain('fill="#222222"');
            expect(svg).toContain('rotate(0, 20, 20)');
            expect(svg).toContain('rotate(90, 20, 20)');
        });

        it('should show the total of the cluster', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);
            const svg = pieChart.getClusterPieChartSVG(40, sectors, 4);

            expect(svg).toContain('clusterMarkersTotal');
            expect(svg).toContain('>4<');
        });
    });

    describe('getSimplePieChartSVG', () => {

        it('should build an svg with the sector fills and rotations', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);
            const svg = pieChart.getSimplePieChartSVG(40, sectors);

            expect(svg).toContain('<svg');
            expect(svg).toContain('fill="#111111"');
            expect(svg).toContain('rotate(0, 20, 20)');
        });

        it('should not add the total of the cluster', () => {
            const sectors = pieChart.calculateSectors({ 'ref-a': 1, 'ref-b': 3 }, 4, 40, legend);
            const svg = pieChart.getSimplePieChartSVG(40, sectors);

            expect(svg).not.toContain('clusterMarkersTotal');
        });
    });

    describe('renderClusters', () => {

        it('should build the cluster group with an icon create function', () => {
            global.window.L = {
                markerClusterGroup: jest.fn(() => 'a cluster group'),
                divIcon: jest.fn((options) => options),
                Point: jest.fn((x, y) => ({ x, y }))
            };

            const group = pieChart.renderClusters(
                { possibleAnswersHashMap: { 'ref-a': 'Answer A' } },
                { maxClusterRadius: 40 },
                legend
            );

            expect(global.window.L.markerClusterGroup).toHaveBeenCalled();
            expect(group).toBe('a cluster group');
        });

        it('should build a pie chart distribution over the possible answers', () => {
            global.window.L = {
                markerClusterGroup: jest.fn(() => 'a cluster group'),
                divIcon: jest.fn((options) => options),
                Point: jest.fn((x, y) => ({ x, y }))
            };

            pieChart.renderClusters(
                { possibleAnswersHashMap: { 'ref-a': 'Answer A' } },
                { maxClusterRadius: 40 },
                legend
            );

            const options = global.window.L.markerClusterGroup.mock.calls[0][0];
            const cluster = {
                getAllChildMarkers: () => [
                    { options: { possible_answers: { 'ref-a': 'Answer A' } } },
                    { options: { possible_answers: {} } }
                ]
            };

            const icon = options.iconCreateFunction(cluster);

            expect(global.window.L.divIcon).toHaveBeenCalled();
            expect(icon.html).toContain('<svg');
            expect(icon.html).toContain('fill="#111111"');
            expect(icon.iconSize).toEqual({ x: 30, y: 30 });
        });
    });
});
