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

  it('maps branch rows without a children cell and shifts the fixed offsets', () => {
    const rows = [
      {
        id: 'branch-entry-1',
        cells: [
          { entryUuid: 'branch-entry-1' },
          {},
          {},
          { answer: 'Branch row title' },
          { answer: '12th Apr, 2024' },
          { answer: 'Alpha' }
        ]
      }
    ];

    expect(mapTableRowsToGrid(rows, true)).toEqual([
      expect.objectContaining({
        id: 'branch-entry-1',
        children: null,
        title: 'Branch row title',
        createdAt: '12th Apr, 2024',
        answer_0: 'Alpha',
        __fixedCellsTotal: 5
      })
    ]);
  });
});
