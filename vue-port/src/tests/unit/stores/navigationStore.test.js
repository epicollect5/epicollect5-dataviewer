import { createPinia, setActivePinia } from 'pinia';
import { useNavigationStore } from '@/stores/navigationStore';

describe('navigationStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('restores the saved hierarchy after a data editor round trip', () => {
    const store = useNavigationStore();
    const savedHierarchy = [
      { formRef: 'form_1', formName: 'Form 1', parentEntryUuid: null },
      { formRef: 'form_2', formName: 'Form 2', parentEntryUuid: 'entry-1' }
    ];

    store.setCurrentForm('form_1', 'Form 1');
    store.restoreHierarchy({
      hierarchyNavigator: savedHierarchy,
      currentFormRef: 'form_2',
      currentFormName: 'Form 2',
      isViewingChildren: true
    });

    expect(store.currentFormRef).toBe('form_2');
    expect(store.currentFormName).toBe('Form 2');
    expect(store.isViewingChildren).toBe(true);
    expect(store.isViewingBranch).toBe(false);
    expect(store.isRestoring).toBe(true);
    expect(store.hierarchyNavigator).toEqual(savedHierarchy);
    expect(store.hierarchyNavigator).not.toBe(savedHierarchy);
  });

  it('restores a root form view without a child hierarchy', () => {
    const store = useNavigationStore();

    store.setCurrentForm('form_1', 'Form 1');
    store.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    store.restoreHierarchy({
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      currentFormRef: 'form_1',
      currentFormName: 'Form 1',
      isViewingChildren: false
    });

    expect(store.hierarchyNavigator).toHaveLength(1);
    expect(store.isViewingChildren).toBe(false);
  });

  it('opens and leaves a branch without changing the current form', () => {
    const store = useNavigationStore();

    store.setCurrentForm('form_1', 'Form 1');
    store.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Parent entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1'
    });

    expect(store.isViewingBranch).toBe(true);
    expect(store.currentBranchRef).toBe('branch_1');
    expect(store.currentBranchOwnerUuid).toBe('entry-1');
    expect(store.currentBranchOwnerEntryTitle).toBe('Parent entry');
    expect(store.branchBackLink).toBe('https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1');
    expect(store.currentFormRef).toBe('form_1');
    expect(store.hierarchyNavigator).toHaveLength(1);

    store.leaveBranch();

    expect(store.isViewingBranch).toBe(false);
    expect(store.currentBranchRef).toBe(null);
    expect(store.currentBranchOwnerUuid).toBe(null);
    expect(store.currentBranchOwnerEntryTitle).toBe(null);
    expect(store.branchBackLink).toBe(null);
  });

  it('drops the branch when the hierarchy moves', () => {
    const store = useNavigationStore();

    store.setCurrentForm('form_1', 'Form 1');
    store.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    store.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-2',
      ownerEntryTitle: 'Child entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_2'
    });

    store.navigateBack();

    expect(store.isViewingBranch).toBe(false);
    expect(store.currentBranchRef).toBe(null);
    expect(store.currentBranchOwnerUuid).toBe(null);

    store.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-3',
      ownerEntryTitle: 'Other entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1'
    });
    store.resetHierarchy();

    expect(store.isViewingBranch).toBe(false);
    expect(store.currentBranchRef).toBe(null);
    expect(store.currentBranchOwnerEntryTitle).toBe(null);
  });

  it('tracks the restoring handshake for the map', () => {
    const store = useNavigationStore();

    store.setRestoring(true);
    expect(store.isRestoring).toBe(true);

    store.setRestoring(false);
    expect(store.isRestoring).toBe(false);
  });
});
