import { createPinia, setActivePinia } from 'pinia';
import PARAMETERS from '@/core/config/parameters';
import { fetchEntries } from '@/services/api/entriesApi';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

vi.mock('@/services/api/entriesApi', () => ({
  fetchEntries: vi.fn()
}));

describe('stores/tableStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds entries request params from navigation and filters state', () => {
    const filtersStore = useFiltersStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    filtersStore.setTitle('abc');
    filtersStore.setDates('2024-01-01T00:00:00.000Z', '2024-01-31T00:00:00.000Z');
    filtersStore.setOrder(PARAMETERS.ORDER_BY.AZ, 'title', 'ASC');

    expect(tableStore.buildEntriesParams({ page: 3 })).toEqual({
      form_ref: 'form_1',
      title: 'abc',
      filter_from: '2024-01-01T00:00:00.000Z',
      filter_to: '2024-01-31T00:00:00.000Z',
      filter_by: 'created_at',
      sort_by: 'title',
      sort_order: 'ASC',
      page: 3
    });
  });

  it('includes the hierarchy parent params when viewing children', () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });

    expect(tableStore.buildEntriesParams({ page: 1 })).toEqual(expect.objectContaining({
      form_ref: 'form_2',
      parent_form_ref: 'form_1',
      parent_uuid: 'entry-1',
      page: 1
    }));
  });

  it('sends the branch params instead of the parent params while viewing a branch', () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-9',
      ownerEntryTitle: 'Owner entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_2&page=1'
    });

    const params = tableStore.buildEntriesParams({ page: 2 });

    expect(params).toEqual(expect.objectContaining({
      form_ref: 'form_2',
      branch_ref: 'branch_1',
      branch_owner_uuid: 'entry-9',
      page: 2
    }));
    expect(params.parent_form_ref).toBeUndefined();
    expect(params.parent_uuid).toBeUndefined();
  });

  it('opens the branch of an entry and resets filters', async () => {
    const filtersStore = useFiltersStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    filtersStore.setTitle('abc');
    tableStore.links = { self: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&page=2' };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.loadBranchEntries({
      entryUuid: 'entry-1',
      entryTitle: 'Owner entry',
      branchRef: 'branch_1'
    });

    expect(navigationStore.isViewingBranch).toBe(true);
    expect(navigationStore.currentBranchRef).toBe('branch_1');
    expect(navigationStore.currentBranchOwnerUuid).toBe('entry-1');
    expect(navigationStore.currentBranchOwnerEntryTitle).toBe('Owner entry');
    expect(navigationStore.branchBackLink).toBe('https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&page=2');
    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(filtersStore.filterByTitle).toBe('');
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('does not open a branch without an owner entry and a branch ref', async () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.loadBranchEntries({ entryUuid: 'entry-1', entryTitle: 'Owner entry', branchRef: '' });
    await tableStore.loadBranchEntries({ entryUuid: '', entryTitle: 'Owner entry', branchRef: 'branch_1' });

    expect(navigationStore.isViewingBranch).toBe(false);
    expect(tableStore.loadEntries).not.toHaveBeenCalled();
  });

  it('leaves the branch and reloads the form entries', async () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Owner entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&page=1'
    });
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.navigateBackFromBranch();

    expect(navigationStore.isViewingBranch).toBe(false);
    expect(navigationStore.currentBranchRef).toBe(null);
    expect(navigationStore.currentBranchOwnerUuid).toBe(null);
    expect(navigationStore.branchBackLink).toBe(null);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('builds branch headers and rows for a branch table', async () => {
    vi.useFakeTimers();

    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectExtra = {
      forms: {
        form_1: {
          inputs: ['branch_1'],
          group: {},
          branch: { branch_1: ['q1'] },
          details: { has_location: false, name: 'Form One' }
        }
      },
      inputs: {
        branch_1: { data: { ref: 'branch_1', type: 'branch', question: 'Branch' } },
        q1: { data: { ref: 'q1', type: 'text', question: 'Q1' } }
      }
    };
    projectStore.projectDefinition = {
      project: {
        forms: [
          { ref: 'form_1', name: 'Form One' },
          { ref: 'form_2', name: 'Form Two' }
        ]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Owner entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&page=1'
    });
    fetchEntries.mockResolvedValue({
      data: {
        data: {
          entries: [
            {
              entry: { entry_uuid: 'entry-1', title: 'Owner entry', created_at: '2024-04-10 10:00:00', answers: {} },
              branch_entry: {
                entry_uuid: 'branch-entry-1',
                title: 'Branch row',
                created_at: '2024-04-11 10:00:00',
                answers: { q1: { answer: 'Alpha' } }
              },
              attributes: { child_counts: 0, branch_counts: {} },
              relationships: {}
            }
          ]
        },
        meta: { total: 1, current_page: 1, last_page: 1 },
        links: { self: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&branch_ref=branch_1&page=1' }
      }
    });

    const loadPromise = tableStore.loadEntries({ params: { page: 1 } });

    await vi.advanceTimersByTimeAsync(PARAMETERS.DELAY.TABLE_PAGE_MIN);
    await loadPromise;

    expect(tableStore.isBranchTable).toBe(true);
    expect(tableStore.hasChildForm).toBe(false);
    expect(tableStore.headers).toEqual([{ inputRef: 'q1', question: 'Q1' }]);
    expect(tableStore.gridRows[0]).toEqual(expect.objectContaining({
      title: 'Branch row',
      __fixedCellsTotal: 5,
      answer_0: 'Alpha'
    }));
  });

  it('loads the immediate child form entries and resets filters', async () => {
    const filtersStore = useFiltersStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectDefinition = {
      project: {
        forms: [
          { ref: 'form_1', name: 'Form One' },
          { ref: 'form_2', name: 'Form Two' }
        ]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    filtersStore.setTitle('abc');
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.loadChildEntries({
      entryUuid: 'entry-1',
      entryTitle: 'Parent entry'
    });

    expect(navigationStore.currentFormRef).toBe('form_2');
    expect(navigationStore.currentFormName).toBe('Form Two');
    expect(navigationStore.isViewingChildren).toBe(true);
    expect(navigationStore.hierarchyNavigator).toHaveLength(2);
    expect(navigationStore.hierarchyNavigator[1]).toEqual(expect.objectContaining({
      formRef: 'form_2',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    }));
    expect(filtersStore.filterByTitle).toBe('');
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('does not navigate to children from a leaf form', async () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form One' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.loadChildEntries({
      entryUuid: 'entry-1',
      entryTitle: 'Parent entry'
    });

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.hierarchyNavigator).toHaveLength(1);
    expect(tableStore.loadEntries).not.toHaveBeenCalled();
  });

  it('navigates back to the parent form and reloads its entries', async () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.navigateBack();

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.currentFormName).toBe('Form One');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(navigationStore.hierarchyNavigator).toHaveLength(1);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('resets the hierarchy to the root form and reloads its entries', async () => {
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    navigationStore.enterChildForm({
      formRef: 'form_3',
      formName: 'Form Three',
      parentEntryUuid: 'entry-2',
      parentEntryTitle: 'Nested entry'
    });
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    await tableStore.navigateToRoot();

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.currentFormName).toBe('Form One');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(navigationStore.hierarchyNavigator).toHaveLength(1);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('keeps the table loader up for the minimum page delay', async () => {
    vi.useFakeTimers();

    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectExtra = {
      forms: { form_1: { inputs: [], group: {} } },
      inputs: {}
    };
    projectStore.projectDefinition = {
      project: { forms: [{ ref: 'form_1', inputs: [] }] }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    fetchEntries.mockResolvedValue({
      data: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1 },
        links: { self: 'https://five.epicollect.net/api/entries/demo?page=1' }
      }
    });

    expect(PARAMETERS.DELAY.TABLE_PAGE_MIN).toBe(2000);

    const loadPromise = tableStore.loadEntries({ params: { page: 1 } });

    await vi.advanceTimersByTimeAsync(0);

    expect(tableStore.isFetchingPage).toBe(true);
    expect(tableStore.hasLoadedInitialPage).toBe(false);

    await vi.advanceTimersByTimeAsync(PARAMETERS.DELAY.TABLE_PAGE_MIN - 1);

    expect(tableStore.hasLoadedInitialPage).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await loadPromise;

    expect(tableStore.hasLoadedInitialPage).toBe(true);
    expect(tableStore.isFetchingPage).toBe(false);
  });
});
