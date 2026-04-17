import { createPinia, setActivePinia } from 'pinia';
import { useUploadStore } from '@/stores/uploadStore';

describe('stores/uploadStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('resets upload state back to defaults', () => {
    const uploadStore = useUploadStore();

    uploadStore.uploadedRows = [{ ec5_uuid: '1' }];
    uploadStore.bulkUploadableHeaders = ['ec5_uuid'];
    uploadStore.reverseEntries = [{ id: 1 }];
    uploadStore.failedReverseEntries = [{ id: 2 }];
    uploadStore.reverseMapping = { reverse: {} };
    uploadStore.filterByFailed = true;
    uploadStore.generatedUuids = ['1'];
    uploadStore.uploadResults = [{ status: 'error' }];
    uploadStore.parsingError = 'bad file';
    uploadStore.isPreparing = true;
    uploadStore.isUploading = true;

    uploadStore.reset();

    expect(uploadStore.uploadedRows).toEqual([]);
    expect(uploadStore.bulkUploadableHeaders).toEqual([]);
    expect(uploadStore.reverseEntries).toEqual([]);
    expect(uploadStore.failedReverseEntries).toEqual([]);
    expect(uploadStore.reverseMapping).toEqual([]);
    expect(uploadStore.filterByFailed).toBe(false);
    expect(uploadStore.generatedUuids).toEqual([]);
    expect(uploadStore.uploadResults).toEqual([]);
    expect(uploadStore.parsingError).toBe('');
    expect(uploadStore.isPreparing).toBe(false);
    expect(uploadStore.isUploading).toBe(false);
  });
});
