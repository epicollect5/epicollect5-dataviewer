import { buildUploadRowPairs } from '@/core/upload/uploadRowPairing';

describe('core/upload/uploadRowPairing', () => {
  const reverseEntries = [
    {
      data: {
        type: 'entry',
        entry: {
          entry_uuid: 'uuid-1'
        }
      }
    },
    {
      data: {
        type: 'entry',
        entry: {
          entry_uuid: 'uuid-2'
        }
      }
    }
  ];

  const uploadedRows = [
    { ec5_uuid: 'uuid-1', name: 'alpha' },
    { ec5_uuid: 'uuid-2', name: 'beta' }
  ];

  const responses = [
    { status: 'success', payload: {} },
    { status: 'error', errors: [{ source: 'input_name', title: 'Name is invalid' }] }
  ];

  it('creates a data row for each upload and an adjacent error row for failures', () => {
    const rows = buildUploadRowPairs({
      uploadedRows,
      reverseEntries,
      responses,
      reverseMapping: { reverse: {} },
      generatedUuids: [],
      filterByFailed: false
    });

    expect(rows.map((row) => row.rowType)).toEqual(['data', 'data', 'error']);
    expect(rows[1].pairId).toBe(rows[2].pairId);
  });

  it('filters to failed pairs only', () => {
    const rows = buildUploadRowPairs({
      uploadedRows,
      reverseEntries,
      responses,
      reverseMapping: { reverse: {} },
      generatedUuids: [],
      filterByFailed: true
    });

    expect(rows.map((row) => row.rowType)).toEqual(['data', 'error']);
    expect(rows[0].entryUuid).toBe('uuid-2');
  });

  it('hides generated uuids for newly created rows', () => {
    const rows = buildUploadRowPairs({
      uploadedRows: [uploadedRows[0]],
      reverseEntries: [reverseEntries[0]],
      responses: [responses[0]],
      reverseMapping: { reverse: {} },
      generatedUuids: ['uuid-1'],
      filterByFailed: false
    });

    expect(rows[0].entryUuid).toBe('');
  });
});
