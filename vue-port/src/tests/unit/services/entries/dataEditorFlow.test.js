import { createPinia, setActivePinia } from 'pinia';
import {
  buildAddChildEntryUrl,
  buildEditEntryUrl,
  buildRestoreParams,
  canAddEntryForProjectUser,
  canEditEntryForProjectUser,
  buildAddBranchEntryUrl,
  openAddBranchEntry,
  openAddChildEntry,
  openEditEntry
} from '@/services/entries/dataEditorFlow';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

const envMock = vi.hoisted(() => ({
  appName: 'test',
  serverUrl: 'https://five.epicollect.net',
  dataEditorBaseUrl: 'https://five.epicollect.net',
  projectSlug: '',
  defaultProjectSlug: '',
  mapboxApiToken: '',
  esriApiToken: '',
  isDev: false
}));

vi.mock('@/core/config/env', () => ({
  default: envMock
}));

const SELF_LINK = 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1&page=3&sort_by=created_at&sort_order=DESC';

const seedProject = () => {
  const projectStore = useProjectStore();

  projectStore.projectSlug = 'demo';
  projectStore.projectDefinition = {
    project: {
      forms: [
        { ref: 'form_1', name: 'Form 1' },
        { ref: 'form_2', name: 'Form 2' },
        { ref: 'form_3', name: 'Form 3' }
      ]
    }
  };

  return projectStore;
};

describe('services/entries/dataEditorFlow', () => {
  let openSpy;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    envMock.isDev = false;
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
    localStorage.clear();
  });

  it('builds the add-entry url for the child form of the clicked entry', () => {
    const url = buildAddChildEntryUrl({
      selfLink: SELF_LINK,
      formRef: 'form_1',
      childFormRef: 'form_2',
      entryUuid: 'entry-1'
    });
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://five.epicollect.net/add-entry');
    expect(params.get('form_ref')).toBe('form_2');
    expect(params.get('parent_form_ref')).toBe('form_1');
    expect(params.get('parent_uuid')).toBe('entry-1');
    //the current list query is carried over, as legacy does
    expect(params.get('page')).toBe('3');
    expect(params.get('sort_by')).toBe('created_at');
    expect(params.get('sort_order')).toBe('DESC');
  });

  it('returns no url when the view cannot add a child entry', () => {
    expect(buildAddChildEntryUrl({ selfLink: '', formRef: 'form_1', childFormRef: 'form_2', entryUuid: 'entry-1' })).toBe('');
    expect(buildAddChildEntryUrl({ selfLink: SELF_LINK, formRef: 'form_1', childFormRef: false, entryUuid: 'entry-1' })).toBe('');
    expect(buildAddChildEntryUrl({ selfLink: SELF_LINK, formRef: 'form_1', childFormRef: 'form_2', entryUuid: null })).toBe('');
  });

  it('builds the edit-entry url carrying the clicked entry uuid', () => {
    const url = buildEditEntryUrl({ selfLink: SELF_LINK, entryUuid: 'entry-1' });
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://five.epicollect.net/edit-entry');
    expect(params.get('uuid')).toBe('entry-1');
    //the current list query comes along, so the editor can send the user back to it
    expect(params.get('form_ref')).toBe('form_1');
    expect(params.get('page')).toBe('3');
    expect(params.get('sort_order')).toBe('DESC');
  });

  it('returns no edit url without an entry uuid or a self link', () => {
    expect(buildEditEntryUrl({ selfLink: SELF_LINK, entryUuid: null })).toBe('');
    expect(buildEditEntryUrl({ selfLink: '', entryUuid: 'entry-1' })).toBe('');
  });

  it('builds restore params for the view that was left behind', () => {
    const params = buildRestoreParams({
      projectSlug: 'demo',
      formRef: 'form_2',
      formName: 'Form 2',
      parentFormRef: 'form_2',
      hierarchyNavigator: [{ formRef: 'form_1' }, { formRef: 'form_2' }],
      isViewingChildren: true,
      entriesFilters: { filterByTitle: 'river' },
      page: 2
    });

    expect(params).toEqual({
      projectSlug: 'demo',
      savedAt: expect.any(Number),
      formRef: 'form_2',
      formName: 'Form 2',
      parentFormRef: 'form_2',
      hierarchyNavigator: [{ formRef: 'form_1' }, { formRef: 'form_2' }],
      isViewingChildren: true,
      isViewingBranch: false,
      branchRef: null,
      branchOwnerUuid: null,
      branchOwnerEntryTitle: null,
      branchBackLink: null,
      page: 2,
      entriesFilters: { filterByTitle: 'river' }
    });
  });

  it('builds the add-branch-entry url for the clicked owner entry', () => {
    const url = buildAddBranchEntryUrl({
      selfLink: `${SELF_LINK}&branch_ref=branch_1`,
      branchRef: 'branch_1',
      entryUuid: 'entry-1'
    });
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;

    expect(parsedUrl.origin + parsedUrl.pathname).toBe('https://five.epicollect.net/add-entry');
    expect(params.get('branch_ref')).toBe('branch_1');
    expect(params.get('branch_owner_uuid')).toBe('entry-1');
    expect(params.get('form_ref')).toBe('form_1');
    expect(params.get('page')).toBe('3');
  });

  it('returns no branch url without a branch ref or an owner entry', () => {
    expect(buildAddBranchEntryUrl({ selfLink: SELF_LINK, branchRef: '', entryUuid: 'entry-1' })).toBe('');
    expect(buildAddBranchEntryUrl({ selfLink: SELF_LINK, branchRef: 'branch_1', entryUuid: null })).toBe('');
    expect(buildAddBranchEntryUrl({ selfLink: '', branchRef: 'branch_1', entryUuid: 'entry-1' })).toBe('');
  });

  it('saves a branch restore blob and opens the data editor', () => {
    seedProject();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Parent entry',
      backLink: SELF_LINK
    });
    tableStore.links = { self: SELF_LINK };
    tableStore.pagination = { current_page: 2 };

    expect(openAddBranchEntry({
      entryUuid: 'entry-1',
      branchRef: 'branch_1',
      entryTitle: 'Parent entry'
    })).toBe(true);

    const openedUrl = new URL(openSpy.mock.calls[0][0]);
    const savedParams = JSON.parse(localStorage.getItem('epicollect5-restore'));

    expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_self');
    expect(openedUrl.searchParams.get('branch_ref')).toBe('branch_1');
    expect(openedUrl.searchParams.get('branch_owner_uuid')).toBe('entry-1');
    expect(savedParams).toEqual(expect.objectContaining({
      projectSlug: 'demo',
      formRef: 'form_1',
      formName: 'Form 1',
      isViewingChildren: false,
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Parent entry',
      branchBackLink: SELF_LINK,
      page: 2
    }));
  });

  it('leaves the stored params untouched when the branch add cannot be built', () => {
    const tableStore = useTableStore();

    tableStore.links = { self: SELF_LINK };

    expect(openAddBranchEntry({ entryUuid: null, branchRef: 'branch_1' })).toBe(false);
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('saves the restore params and opens the data editor from a root form row', () => {
    const projectStore = seedProject();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const filtersStore = useFiltersStore();

    navigationStore.setCurrentForm('form_1', 'Form 1');
    tableStore.links = { self: SELF_LINK, prev: null, next: null };
    tableStore.pagination = { total: 12, current_page: 3, last_page: 3 };
    filtersStore.setTitle('river');

    const didOpen = openAddChildEntry({ entryUuid: 'entry-1' });
    const savedParams = JSON.parse(localStorage.getItem('epicollect5-restore'));
    const openedUrl = new URL(openSpy.mock.calls[0][0]);

    expect(didOpen).toBe(true);
    expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_self');
    expect(openedUrl.pathname).toBe('/add-entry');
    expect(openedUrl.searchParams.get('form_ref')).toBe('form_2');
    expect(savedParams).toEqual(expect.objectContaining({
      projectSlug: 'demo',
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      isViewingChildren: false,
      isViewingBranch: false,
      page: 3
    }));
    expect(savedParams.hierarchyNavigator).toHaveLength(1);
    expect(savedParams.hierarchyNavigator[0].formRef).toBe('form_1');
    expect(savedParams.entriesFilters).toEqual({
      filterByTitle: 'river',
      startDate: '',
      endDate: '',
      selectedOrderBy: 'Newest',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
    expect(projectStore.projectSlug).toBe('demo');
  });

  it('adds a grandchild entry while viewing a child form', () => {
    seedProject();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-9',
      parentEntryTitle: 'Parent entry'
    });
    tableStore.links = { self: SELF_LINK };
    tableStore.pagination = { current_page: 1 };

    openAddChildEntry({ entryUuid: 'entry-1' });

    const openedUrl = new URL(openSpy.mock.calls[0][0]);
    const savedParams = JSON.parse(localStorage.getItem('epicollect5-restore'));

    expect(openedUrl.searchParams.get('form_ref')).toBe('form_3');
    expect(openedUrl.searchParams.get('parent_form_ref')).toBe('form_2');
    expect(openedUrl.searchParams.get('parent_uuid')).toBe('entry-1');
    expect(savedParams.formRef).toBe('form_2');
    expect(savedParams.isViewingChildren).toBe(true);
    expect(savedParams.hierarchyNavigator.map((navigator) => navigator.formRef)).toEqual(['form_1', 'form_2']);
  });

  it('leaves the stored params untouched when there is no child form', () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');
    tableStore.links = { self: SELF_LINK };

    expect(openAddChildEntry({ entryUuid: 'entry-1' })).toBe(false);
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('saves the view and opens the editor for a branch entry that is being edited', () => {
    seedProject();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Parent entry',
      backLink: SELF_LINK
    });
    tableStore.links = { self: SELF_LINK };
    tableStore.pagination = { current_page: 2 };

    expect(openEditEntry({ entryUuid: 'branch-entry-1' })).toBe(true);

    const openedUrl = new URL(openSpy.mock.calls[0][0]);
    const savedParams = JSON.parse(localStorage.getItem('epicollect5-restore'));

    expect(openSpy).toHaveBeenCalledWith(expect.any(String), '_self');
    expect(openedUrl.pathname).toBe('/edit-entry');
    expect(openedUrl.searchParams.get('uuid')).toBe('branch-entry-1');
    //the branch the entry belongs to is part of the view to restore
    expect(savedParams).toEqual(expect.objectContaining({
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Parent entry',
      branchBackLink: SELF_LINK,
      page: 2
    }));
  });

  it('leaves the stored params untouched when the edit cannot be built', () => {
    const tableStore = useTableStore();

    tableStore.links = { self: SELF_LINK };

    expect(openEditEntry({ entryUuid: null })).toBe(false);
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('gates editing on the project role and the entry ownership', () => {
    const projectStore = useProjectStore();
    const ownEntry = { user: { data: { id: 42 } } };
    const otherEntry = { user: { data: { id: 7 } } };

    projectStore.projectUser = { id: 42, role: 'curator' };
    expect(canEditEntryForProjectUser({ relationships: otherEntry })).toBe(true);

    projectStore.projectUser = { id: 42, role: 'collector' };
    expect(canEditEntryForProjectUser({ relationships: ownEntry })).toBe(true);
    expect(canEditEntryForProjectUser({ relationships: otherEntry })).toBe(false);

    //a collector may not edit an entry whose owner is unknown
    expect(canEditEntryForProjectUser({})).toBe(false);

    //a viewer never edits, not even their own entry
    projectStore.projectUser = { id: 42, role: 'viewer' };
    expect(canEditEntryForProjectUser({ relationships: ownEntry })).toBe(false);

    projectStore.projectUser = { id: null, role: null };
    expect(canEditEntryForProjectUser({ relationships: ownEntry })).toBe(false);

    envMock.isDev = true;
    expect(canEditEntryForProjectUser({ relationships: otherEntry })).toBe(true);
  });

  it('gates the action on the project user, with a development bypass', () => {
    const projectStore = useProjectStore();

    projectStore.projectUser = { id: null, role: null };
    expect(canAddEntryForProjectUser()).toBe(false);

    projectStore.projectUser = { id: 42, role: null };
    expect(canAddEntryForProjectUser()).toBe(true);

    projectStore.projectUser = { id: null, role: 'collector' };
    expect(canAddEntryForProjectUser()).toBe(true);

    projectStore.projectUser = {};
    envMock.isDev = true;
    expect(canAddEntryForProjectUser()).toBe(true);
  });
});
