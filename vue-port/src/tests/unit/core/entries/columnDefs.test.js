import { createEntriesColumnDefs, mapTableRowsToGrid } from '@/components/table/ag-grid/columnDefs';

describe('components/table/ag-grid/columnDefs', () => {
  it('creates fixed pinned columns before dynamic question columns', () => {
    const headers = [
      { inputRef: 'q1', question: 'Question 1' },
      { inputRef: 'q2', question: 'Question 2' }
    ];

    const columnDefs = createEntriesColumnDefs(headers);

    expect(columnDefs.slice(0, 6).map((column) => column.field)).toEqual([
      'view',
      'delete',
      'edit',
      'children',
      'title',
      'createdAt'
    ]);
    expect(columnDefs[6].headerName).toBe('Question 1');
    expect(columnDefs[7].headerName).toBe('Question 2');
  });

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
