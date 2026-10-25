import { clearPendingRestore, getPendingRestore, RESTORE_MAX_AGE_MS } from '@/services/entries/restoreFlow';

const STORAGE_KEY = 'epicollect5-restore';

const projectStore = {
  projectSlug: 'demo',
  forms: [
    { ref: 'form_1', name: 'Form 1' },
    { ref: 'form_2', name: 'Form 2' }
  ]
};

const buildChildRestore = (overrides = {}) => ({
  projectSlug: 'demo',
  savedAt: Date.now(),
  formRef: 'form_2',
  formName: 'Form 2',
  parentFormRef: 'form_2',
  hierarchyNavigator: [
    { formRef: 'form_1', formName: 'Form 1' },
    { formRef: 'form_2', formName: 'Form 2' }
  ],
  isViewingChildren: true,
  isViewingBranch: false,
  page: 2,
  entriesFilters: { filterByTitle: 'river' },
  ...overrides
});

const saveRestore = (params) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
};

describe('services/entries/restoreFlow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns the saved view for a fresh round trip', () => {
    saveRestore(buildChildRestore());

    const restoreParams = getPendingRestore({ restoreQuery: '1', projectStore });

    expect(restoreParams).toEqual(expect.objectContaining({
      projectSlug: 'demo',
      formRef: 'form_2',
      isViewingChildren: true,
      page: 2
    }));
  });

  it('ignores the saved view when the url does not ask for a restore', () => {
    saveRestore(buildChildRestore());

    expect(getPendingRestore({ restoreQuery: undefined, projectStore })).toBe(null);
    expect(getPendingRestore({ restoreQuery: '', projectStore })).toBe(null);
  });

  it('ignores an empty storage', () => {
    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores params saved for another project', () => {
    saveRestore(buildChildRestore({ projectSlug: 'another-project' }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores branch views', () => {
    saveRestore(buildChildRestore({ isViewingBranch: true }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores a hierarchy pointing at unknown forms', () => {
    saveRestore(buildChildRestore({
      formRef: 'form_removed',
      hierarchyNavigator: [
        { formRef: 'form_1', formName: 'Form 1' },
        { formRef: 'form_removed', formName: 'Removed' }
      ]
    }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('accepts a branch view saved from a branch add', () => {
    saveRestore(buildChildRestore({
      isViewingChildren: false,
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      formRef: 'form_1',
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Owner entry',
      branchBackLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1'
    }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toEqual(expect.objectContaining({
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1'
    }));
  });

  it('ignores a branch view without its branch scope', () => {
    saveRestore(buildChildRestore({
      isViewingChildren: false,
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      formRef: 'form_1',
      isViewingBranch: true
    }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores a branch view without its owner entry', () => {
    saveRestore(buildChildRestore({
      isViewingChildren: false,
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      formRef: 'form_1',
      isViewingBranch: true,
      branchRef: 'branch_1'
    }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores flags that disagree with the saved hierarchy', () => {
    saveRestore(buildChildRestore({ isViewingChildren: false }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores a form ref that is not the one being viewed', () => {
    saveRestore(buildChildRestore({ formRef: 'form_1' }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('ignores params older than the round trip window', () => {
    saveRestore(buildChildRestore({ savedAt: Date.now() - RESTORE_MAX_AGE_MS - 1000 }));

    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });

  it('clears the saved view', () => {
    saveRestore(buildChildRestore());
    clearPendingRestore();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(null);
    expect(getPendingRestore({ restoreQuery: '1', projectStore })).toBe(null);
  });
});
