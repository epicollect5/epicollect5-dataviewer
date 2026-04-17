import { defineStore } from 'pinia';

const createRootNavigator = () => ({
  formRef: null,
  formName: null,
  parentEntryTitle: null,
  parentEntryUuid: null,
  entryUuid: null,
  selfLink: null
});

export const useNavigationStore = defineStore('navigation', {
  state: () => ({
    hierarchyNavigator: [createRootNavigator()],
    currentFormRef: null,
    currentBranchRef: null,
    currentBranchOwnerEntryTitle: null,
    branchBackLink: null,
    currentFormName: null,
    isPerformingLongAction: false,
    isFetching: false,
    isRejected: false,
    activePage: 'table',
    isViewingChildren: false,
    isViewingBranch: false,
    isFirstMapLoad: true,
    isRestoring: false
  }),
  actions: {
    setActivePage(page) {
      this.activePage = page;
    },
    setBusy(status) {
      this.isPerformingLongAction = status;
    },
    setCurrentForm(formRef, formName) {
      this.currentFormRef = formRef;
      this.currentFormName = formName;
      this.hierarchyNavigator = [
        {
          ...createRootNavigator(),
          formRef,
          formName
        }
      ];
      this.isViewingChildren = false;
      this.isViewingBranch = false;
      this.currentBranchRef = null;
    }
  }
});
