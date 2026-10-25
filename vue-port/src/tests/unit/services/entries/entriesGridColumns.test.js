import { createPinia, setActivePinia } from 'pinia';
import { createEntriesColumnDefs } from '@/services/entries/entriesGridColumns';
import {
  canEditEntryForProjectUser,
  openAddBranchEntry,
  openAddChildEntry,
  openEditEntry
} from '@/services/entries/dataEditorFlow';
import { useModalStore } from '@/stores/modalStore';
import { useTableStore } from '@/stores/tableStore';

vi.mock('@/services/entries/dataEditorFlow', () => ({
  openAddChildEntry: vi.fn(),
  openAddBranchEntry: vi.fn(),
  openEditEntry: vi.fn(),
  canEditEntryForProjectUser: vi.fn(() => true)
}));

describe('services/entries/entriesGridColumns', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    openAddChildEntry.mockClear();
    openAddBranchEntry.mockClear();
    openEditEntry.mockClear();
    canEditEntryForProjectUser.mockClear();
    canEditEntryForProjectUser.mockReturnValue(true);
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
    const tableStore = useTableStore();
    const loadChildEntries = vi.spyOn(tableStore, 'loadChildEntries').mockResolvedValue();
    const columnDefs = createEntriesColumnDefs([], {
      childFormName: 'Household members',
      hasChildForm: true,
      canAddEntry: true
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
    expect(openAddChildEntry).toHaveBeenCalledWith({
      entryUuid: 'entry-1'
    });
  });

  it('omits the add button when the project user cannot add entries', () => {
    const columnDefs = createEntriesColumnDefs([], {
      childFormName: 'Household members',
      hasChildForm: true
    });
    const childCell = columnDefs[3].cellRenderer({
      value: 0,
      data: {
        id: 'entry-1',
        title: 'Parent entry'
      }
    });

    expect(childCell.querySelector('.entries-grid__children-count-button')).not.toBe(null);
    expect(childCell.querySelector('.entries-grid__action-button--add')).toBe(null);
  });

  it('renders a branch count with its own add button', () => {
    const tableStore = useTableStore();
    const loadBranchEntries = vi.spyOn(tableStore, 'loadBranchEntries').mockResolvedValue();
    const columnDefs = createEntriesColumnDefs([
      { inputRef: 'branch_1', question: 'Branch question' }
    ], {
      canAddEntry: true
    });
    const branchColumn = columnDefs[5];
    const branchCell = branchColumn.cellRenderer({
      value: 3,
      data: {
        id: 'entry-1',
        title: 'Parent entry',
        __fixedCellsTotal: 6,
        __cells: [
          { cellType: 'CellView', entryUuid: 'entry-1' },
          { cellType: 'CellDelete', entryUuid: 'entry-1' },
          { cellType: 'CellEdit', entryUuid: 'entry-1' },
          { cellType: 'CellChildren', answer: 0, entryUuid: 'entry-1' },
          { cellType: 'CellText', answer: 'Parent entry', entryUuid: 'entry-1' },
          { cellType: 'CellText', answer: '10 Apr, 2024', entryUuid: 'entry-1' },
          { cellType: 'CellBranch', answer: 3, entryUuid: 'entry-1', inputRef: 'branch_1' }
        ]
      }
    });
    const countButton = branchCell.querySelector('.entries-grid__children-count-button');
    const addButton = branchCell.querySelector('.entries-grid__action-button--add');

    expect(countButton.textContent).toBe('3');
    expect(countButton.getAttribute('aria-label')).toBe('Open branch entries (3)');
    expect(addButton.getAttribute('aria-label')).toBe('Add branch entry');

    countButton.click();
    addButton.click();

    expect(loadBranchEntries).toHaveBeenCalledWith({
      entryUuid: 'entry-1',
      entryTitle: 'Parent entry',
      branchRef: 'branch_1'
    });
    expect(openAddBranchEntry).toHaveBeenCalledWith({
      entryUuid: 'entry-1',
      branchRef: 'branch_1',
      entryTitle: 'Parent entry'
    });
  });

  it('reads the title and answers of a branch row from its own fixed cell count', () => {
    const modalStore = useModalStore();
    const columnDefs = createEntriesColumnDefs([
      { inputRef: 'branch_1', question: 'Branch question' }
    ]);
    const viewButton = columnDefs[0].cellRenderer({
      data: {
        id: 'branch-entry-1',
        __fixedCellsTotal: 5,
        __cells: [
          { cellType: 'CellView', entryUuid: 'branch-entry-1' },
          { cellType: 'CellDelete', entryUuid: 'branch-entry-1' },
          { cellType: 'CellEdit', entryUuid: 'branch-entry-1' },
          { cellType: 'CellText', answer: 'Branch row title', entryUuid: 'branch-entry-1' },
          { cellType: 'CellText', answer: '12 Apr, 2024', entryUuid: 'branch-entry-1' },
          { cellType: 'CellText', answer: 'Alpha', entryUuid: 'branch-entry-1' }
        ]
      }
    });

    viewButton.click();

    expect(modalStore.activeModal).toBe('view-entry');
    expect(modalStore.payload).toEqual({
      entryTitle: 'Branch row title',
      viewHeaders: [{ inputRef: 'branch_1', question: 'Branch question' }],
      viewAnswers: [{ cellType: 'CellText', answer: 'Alpha', entryUuid: 'branch-entry-1' }]
    });
  });

  it('opens the edit page for the row entry and gates it on the entry ownership', () => {
    const columnDefs = createEntriesColumnDefs([]);
    const relationships = { user: { data: { id: 7 } } };
    const data = {
      id: 'entry-1',
      __fixedCellsTotal: 6,
      __cells: [
        { cellType: 'CellView', entryUuid: 'entry-1' },
        { cellType: 'CellDelete', entryUuid: 'entry-1' },
        { cellType: 'CellEdit', entryUuid: 'entry-1' },
        { cellType: 'CellChildren', answer: 0, entryUuid: 'entry-1' },
        { cellType: 'CellText', answer: 'Entry title', entryUuid: 'entry-1', attributes: {}, relationships: null },
        { cellType: 'CellText', answer: '10 Apr, 2024', entryUuid: 'entry-1', attributes: {}, relationships: null },
        { cellType: 'CellText', answer: 'Alpha', entryUuid: 'entry-1', attributes: {}, relationships }
      ]
    };
    const editColumn = columnDefs[2];
    const editButton = editColumn.cellRenderer({ data });

    expect(editButton.getAttribute('aria-label')).toBe('Edit');
    expect(canEditEntryForProjectUser).toHaveBeenCalledWith({ relationships });
    expect(editButton.disabled).toBe(false);

    editButton.click();

    expect(openEditEntry).toHaveBeenCalledWith({ entryUuid: 'entry-1' });
  });

  it('disables the edit action when the project user cannot edit that entry', () => {
    canEditEntryForProjectUser.mockReturnValue(false);
    const columnDefs = createEntriesColumnDefs([]);
    const editButton = columnDefs[2].cellRenderer({
      data: {
        id: 'entry-1',
        __cells: [
          { cellType: 'CellEdit', entryUuid: 'entry-1' },
          { cellType: 'CellText', entryUuid: 'entry-1', attributes: {}, relationships: {} }
        ]
      }
    });

    expect(editButton.disabled).toBe(true);

    editButton.click();

    expect(openEditEntry).not.toHaveBeenCalled();
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
