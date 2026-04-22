import { createPinia, setActivePinia } from 'pinia';
import { createEntriesColumnDefs } from '@/services/entries/entriesGridColumns';
import { useModalStore } from '@/stores/modalStore';

describe('services/entries/entriesGridColumns', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

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

  it('passes both original and preview photo urls to the dedicated photo viewer modal', () => {
    const modalStore = useModalStore();
    const columnDefs = createEntriesColumnDefs([
      { inputRef: 'photo_1', question: 'Photo 1' }
    ]);
    const photoColumn = columnDefs[6];
    const cellElement = photoColumn.cellRenderer({
      data: {
        title: 'Entry title'
      },
      value: {
        entry_thumb: 'https://example.com/thumb.jpg',
        entry_default: 'https://example.com/preview.jpg',
        entry_original: 'https://example.com/original.jpg'
      }
    });

    cellElement.click();

    expect(modalStore.activeModal).toBe('photo-viewer');
    expect(modalStore.payload).toEqual({
      title: 'Entry title',
      src: 'https://example.com/original.jpg',
      previewSrc: 'https://example.com/thumb.jpg'
    });
  });
});
