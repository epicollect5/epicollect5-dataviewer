import { createPinia, setActivePinia } from 'pinia';
import { createEntriesColumnDefs } from '@/services/entries/entriesGridColumns';
import { useModalStore } from '@/stores/modalStore';
import { useTableStore } from '@/stores/tableStore';

describe('services/entries/entriesGridColumns', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('creates fixed pinned columns before dynamic question columns', () => {
    const headers = [
      { inputRef: 'q1', question: 'Question 1' },
      { inputRef: 'q2', question: 'Question 2' }
    ];

    const columnDefs = createEntriesColumnDefs(headers, {
      childFormName: 'Household members',
      hasChildForm: true
    });

    expect(columnDefs.slice(0, 6).map((column) => column.field)).toEqual([
      'view',
      'delete',
      'edit',
      'children',
      'title',
      'createdAt'
    ]);
    expect(columnDefs[3]).toEqual(expect.objectContaining({
      headerName: 'Household members',
      lockPosition: 'left',
      suppressMovable: true,
      headerClass: 'entries-grid__fixed-header',
      cellClass: 'entries-grid__children-cell'
    }));
    expect(columnDefs[4]).toEqual(expect.objectContaining({
      lockPosition: 'left',
      suppressMovable: true,
      cellClass: 'entries-grid__fixed-text-cell'
    }));
    expect(columnDefs[6].headerName).toBe('Question 1');
    expect(columnDefs[7].headerName).toBe('Question 2');
  });

  it('omits the child count column when the current form has no child form', () => {
    const columnDefs = createEntriesColumnDefs([
      { inputRef: 'q1', question: 'Question 1' }
    ]);

    expect(columnDefs.map((column) => column.field)).toEqual([
      'view',
      'delete',
      'edit',
      'title',
      'createdAt',
      'answer_0'
    ]);
  });

  it('renders child count as an interactive count with an add button', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const tableStore = useTableStore();
    const loadChildEntries = vi.spyOn(tableStore, 'loadChildEntries').mockResolvedValue();
    const columnDefs = createEntriesColumnDefs([], {
      childFormName: 'Household members',
      hasChildForm: true
    });
    const childCell = columnDefs[3].cellRenderer({
      value: 4,
      data: {
        id: 'entry-1',
        title: 'Parent entry'
      }
    });
    const countButton = childCell.querySelector('.entries-grid__children-count-button');
    const addButton = childCell.querySelector('.entries-grid__action-button--add');

    expect(childCell.className).toBe('entries-grid__children-cell-content');
    expect(countButton.textContent).toBe('4');
    expect(countButton.getAttribute('aria-label')).toBe('Open child entries (4)');
    expect(addButton.getAttribute('aria-label')).toBe('Add child entry');

    countButton.click();
    addButton.click();

    expect(loadChildEntries).toHaveBeenCalledWith({
      entryUuid: 'entry-1',
      entryTitle: 'Parent entry'
    });
    expect(consoleSpy).toHaveBeenCalledWith('Add child entry clicked', {
      entryUuid: 'entry-1'
    });

    consoleSpy.mockRestore();
  });

  it('renders fixed text cells with ellipsis-ready wrappers', () => {
    const columnDefs = createEntriesColumnDefs([]);
    const titleCell = columnDefs[3].cellRenderer({
      value: 'A very long title that should stay constrained inside the fixed title column'
    });

    expect(titleCell.className).toBe('entries-grid__fixed-text-value');
    expect(titleCell.textContent).toBe('A very long title that should stay constrained inside the fixed title column');
    expect(titleCell.title).toBe('A very long title that should stay constrained inside the fixed title column');
  });

  it('passes both original and preview photo urls to the dedicated photo viewer modal', () => {
    const modalStore = useModalStore();
    const columnDefs = createEntriesColumnDefs([
      { inputRef: 'photo_1', question: 'Photo 1' }
    ]);
    const photoColumn = columnDefs[5];
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

    expect(modalStore.activeModal).toBe(null);
    expect(modalStore.photoViewerPayload).toEqual({
      title: 'Entry title',
      src: 'https://example.com/original.jpg',
      previewSrc: 'https://example.com/thumb.jpg'
    });
  });
});
