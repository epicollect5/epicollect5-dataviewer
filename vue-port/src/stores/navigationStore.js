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
    setFirstMapLoad(status) {
      this.isFirstMapLoad = status;
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
    },
    enterChildForm({ formRef, formName, parentEntryUuid, parentEntryTitle }) {
      this.hierarchyNavigator.push({
        ...createRootNavigator(),
        formRef,
        formName,
        parentEntryTitle,
        parentEntryUuid
      });
      this.currentFormRef = formRef;
      this.currentFormName = formName;
      this.isViewingChildren = true;
    },
    navigateBack() {
      if (this.hierarchyNavigator.length <= 1) {
        return false;
      }

      this.hierarchyNavigator.pop();

      const parentNavigator = this.hierarchyNavigator[this.hierarchyNavigator.length - 1];

      this.currentFormRef = parentNavigator.formRef;
      this.currentFormName = parentNavigator.formName;
      this.isViewingChildren = this.hierarchyNavigator.length > 1;

      return parentNavigator;
    },
    resetHierarchy() {
      if (this.hierarchyNavigator.length <= 1) {
        return false;
      }

      const rootNavigator = this.hierarchyNavigator[0];

      this.hierarchyNavigator = [rootNavigator];
      this.currentFormRef = rootNavigator.formRef;
      this.currentFormName = rootNavigator.formName;
      this.isViewingChildren = false;

      return rootNavigator;
    }
  }
});
