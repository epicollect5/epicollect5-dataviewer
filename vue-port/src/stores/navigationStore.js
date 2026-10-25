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
    currentBranchOwnerUuid: null,
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
    setRestoring(status) {
      this.isRestoring = status;
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
      this.leaveBranch();
    },
    //a branch is scoped to one entry of the current form: the form and hierarchy stay as they are
    enterBranch({ branchRef, ownerEntryUuid, ownerEntryTitle, backLink }) {
      this.isViewingBranch = true;
      this.currentBranchRef = branchRef;
      this.currentBranchOwnerUuid = ownerEntryUuid;
      this.currentBranchOwnerEntryTitle = ownerEntryTitle || null;
      this.branchBackLink = backLink || null;
    },
    leaveBranch() {
      this.isViewingBranch = false;
      this.currentBranchRef = null;
      this.currentBranchOwnerUuid = null;
      this.currentBranchOwnerEntryTitle = null;
      this.branchBackLink = null;
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
      this.leaveBranch();
    },
    //back from the data editor: rebuild the saved hierarchy instead of the root form
    restoreHierarchy({ hierarchyNavigator, currentFormRef, currentFormName, isViewingChildren }) {
      this.hierarchyNavigator = hierarchyNavigator.map((navigator) => ({ ...navigator }));
      this.currentFormRef = currentFormRef;
      this.currentFormName = currentFormName || null;
      this.isViewingChildren = Boolean(isViewingChildren);
      this.leaveBranch();
      this.isRestoring = true;
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
      //a hierarchy move must never keep a branch of the form being left behind
      this.leaveBranch();

      return parentNavigator;
    },
    resetHierarchy() {
      //going back to the root form is never compatible with a branch view, even
      //when the hierarchy is already at its root
      this.leaveBranch();

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
