import { mapTableRowsToGrid } from '@/core/entries/ag-grid/columnDefs';

describe('core/entries/ag-grid/columnDefs', () => {
  it('maps legacy cell arrays into AG Grid row objects', () => {
    const rows = [
      {
        id: 'entry-1',
        cells: [
          { entryUuid: 'entry-1' },
          {},
          {},
          { answer: 3 },
          { answer: 'Entry title' },
          { answer: '15th Jan, 2024' },
          { answer: 'Alpha' },
          { answer: 'Beta' }
        ]
      }
    ];

    expect(mapTableRowsToGrid(rows)).toEqual([
      expect.objectContaining({
        id: 'entry-1',
        children: 3,
        title: 'Entry title',
        createdAt: '15th Jan, 2024',
        answer_0: 'Alpha',
        answer_1: 'Beta'
      })
    ]);
  });
});
