import localstorage from '@/utils/localstorage';

//a saved view is only worth restoring while the data editor round trip is fresh;
//an abandoned editor session would otherwise replay an old position
export const RESTORE_MAX_AGE_MS = 30 * 60 * 1000;

const hasValidHierarchy = (hierarchyNavigator, forms = []) => {
  if (!Array.isArray(hierarchyNavigator) || hierarchyNavigator.length < 1) {
    return false;
  }

  return hierarchyNavigator.every((navigator) => {
    if (!navigator || !navigator.formRef) {
      return false;
    }

    return forms.some((form) => form.ref === navigator.formRef);
  });
};

export const getPendingRestore = ({ restoreQuery, projectStore } = {}) => {
  if (!restoreQuery) {
    return null;
  }

  const restoreParams = localstorage.getRestoreParams();

  if (!restoreParams || typeof restoreParams !== 'object') {
    return null;
  }

  //the key is shared with the legacy app and every project, so a blob saved for
  //another project must never steer this view
  if (!restoreParams.projectSlug || restoreParams.projectSlug !== projectStore?.projectSlug) {
    return null;
  }

  if (!hasValidHierarchy(restoreParams.hierarchyNavigator, projectStore?.forms || [])) {
    return null;
  }

  //a branch view is scoped to the owner entry the branch belongs to
  if (restoreParams.isViewingBranch && (!restoreParams.branchRef || !restoreParams.branchOwnerUuid)) {
    return null;
  }

  const hierarchyNavigator = restoreParams.hierarchyNavigator;
  const activeNavigator = hierarchyNavigator[hierarchyNavigator.length - 1];

  //a hierarchy of one form is the root form, so the flags must agree with it
  if (Boolean(restoreParams.isViewingChildren) !== (hierarchyNavigator.length > 1)) {
    return null;
  }

  //a form ref the saved hierarchy does not end on belongs to a different view
  if (!restoreParams.formRef || restoreParams.formRef !== activeNavigator.formRef) {
    return null;
  }

  const savedAt = Number(restoreParams.savedAt) || 0;

  if (!savedAt || Date.now() - savedAt > RESTORE_MAX_AGE_MS) {
    return null;
  }

  return restoreParams;
};

export const clearPendingRestore = () => {
  localstorage.clear();
};
