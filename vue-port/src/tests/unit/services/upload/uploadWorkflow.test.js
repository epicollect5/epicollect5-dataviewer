import { buildFailedRows } from '@/services/upload/uploadWorkflow';

describe('services/upload/uploadWorkflow', () => {
  it('keeps only the failed rows and strips the non uploadable headers', () => {
    const rows = buildFailedRows({
      uploadResults: [
        { status: 'ok' },
        { status: 'error' }
      ],
      uploadedRows: [
        { title: 'Entry A', internal_id: 12 },
        { title: 'Entry B', internal_id: 13 }
      ],
      bulkUploadableHeaders: ['title']
    });

    expect(rows).toEqual([
      { title: 'Entry B' }
    ]);
  });

  it('returns an empty list when no row failed', () => {
    const rows = buildFailedRows({
      uploadResults: [
        { status: 'ok' }
      ],
      uploadedRows: [
        { title: 'Entry A' }
      ],
      bulkUploadableHeaders: ['title']
    });

    expect(rows).toEqual([]);
  });
});
