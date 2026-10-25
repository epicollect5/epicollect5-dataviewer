import PARAMETERS from '@/core/config/parameters';
import env from '@/core/config/env';
import client from '@/services/api/client';
import tableModel from '@/core/entries/tableModel';
import helpers from '@/utils/helpers';
import localstorage from '@/utils/localstorage';
import { useFiltersStore } from '@/stores/filtersStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

const getDataEditorHref = (path) => {
  return PARAMETERS.DATA_EDITOR_BASE_PATH + path;
};

//legacy parity with the logged in check in CellChildren and CellBranch: while
//debugging the action stays available, otherwise the project user must be known
export const canAddEntryForProjectUser = () => {
  if (env.isDev) {
    return true;
  }

  const projectUser = useProjectStore().projectUser || {};

  return Boolean(projectUser.id || projectUser.role);
};

//legacy parity with CellEdit: a role with edit permissions may edit any entry,
//everyone else only the entries they own, and a VIEWER never edits
const isEntryOwner = (projectUser = {}, relationships = {}) => {
  if (!projectUser.id) {
    return false;
  }

  return projectUser.id === relationships?.user?.data?.id;
};

export const canEditEntryForProjectUser = ({ relationships } = {}) => {
  if (env.isDev) {
    return true;
  }

  const projectUser = useProjectStore().projectUser || {};
  let canEdit = false;

  if (projectUser.role) {
    canEdit = PARAMETERS.USER_PERMISSIONS.CAN_EDIT.includes(projectUser.role);

    if (!canEdit) {
      canEdit = isEntryOwner(projectUser, relationships);
    }
  } else {
    canEdit = isEntryOwner(projectUser, relationships);
  }

  if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
    canEdit = false;
  }

  return canEdit;
};

const buildDataEditorUrl = ({ selfLink, path = PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH, params = {} } = {}) => {
  if (!selfLink) {
    return '';
  }

  const url = new URL(selfLink, client.defaults.baseURL);
  const searchParams = new URLSearchParams(url.search);

  Object.keys(params).forEach((key) => {
    searchParams.set(key, params[key]);
  });

  return getDataEditorHref(path) + '?' + searchParams.toString();
};

export const buildAddChildEntryUrl = ({ selfLink, formRef, childFormRef, entryUuid } = {}) => {
  if (!formRef || !childFormRef || !entryUuid) {
    return '';
  }

  //the data editor adds an entry of the child form to the clicked parent entry
  return buildDataEditorUrl({
    selfLink,
    params: {
      form_ref: childFormRef,
      parent_form_ref: formRef,
      parent_uuid: entryUuid
    }
  });
};

export const buildAddBranchEntryUrl = ({ selfLink, branchRef, entryUuid } = {}) => {
  if (!branchRef || !entryUuid) {
    return '';
  }

  //the data editor adds a branch entry to the clicked owner entry
  return buildDataEditorUrl({
    selfLink,
    params: {
      branch_ref: branchRef,
      branch_owner_uuid: entryUuid
    }
  });
};

export const buildEditEntryUrl = ({ selfLink, entryUuid } = {}) => {
  if (!entryUuid) {
    return '';
  }

  //the data editor edits the clicked entry, so only its uuid is added to the list query
  return buildDataEditorUrl({
    selfLink,
    path: PARAMETERS.DATA_EDITOR_EDIT_ENTRY_PATH,
    params: {
      uuid: entryUuid
    }
  });
};

export const buildRestoreParams = ({
  projectSlug,
  formRef,
  formName,
  parentFormRef,
  hierarchyNavigator,
  isViewingChildren,
  isViewingBranch,
  branchRef,
  branchOwnerUuid,
  branchOwnerEntryTitle,
  branchBackLink,
  entriesFilters,
  page,
  activePage,
  mapView
} = {}) => {
  return {
    projectSlug,
    savedAt: Date.now(),
    formRef,
    formName,
    parentFormRef,
    hierarchyNavigator,
    isViewingChildren: Boolean(isViewingChildren),
    isViewingBranch: Boolean(isViewingBranch),
    branchRef: branchRef || null,
    branchOwnerUuid: branchOwnerUuid || null,
    branchOwnerEntryTitle: branchOwnerEntryTitle || null,
    branchBackLink: branchBackLink || null,
    page: page || 1,
    //the viewer page the round trip started from, so map edits return to the map
    activePage: activePage === 'map' ? 'map' : 'table',
    mapView: mapView || null,
    entriesFilters
  };
};

//the view the user is leaving behind, restored when the data editor sends them back
const saveViewForRestore = (branchOverrides = {}) => {
  const projectStore = useProjectStore();
  const navigationStore = useNavigationStore();
  const tableStore = useTableStore();
  const filtersStore = useFiltersStore();
  const mapStore = useMapStore();

  localstorage.save(buildRestoreParams({
    projectSlug: projectStore.projectSlug,
    formRef: navigationStore.currentFormRef,
    formName: navigationStore.currentFormName,
    parentFormRef: navigationStore.currentFormRef,
    hierarchyNavigator: navigationStore.hierarchyNavigator,
    isViewingChildren: navigationStore.isViewingChildren,
    isViewingBranch: navigationStore.isViewingBranch,
    branchRef: navigationStore.currentBranchRef,
    branchOwnerUuid: navigationStore.currentBranchOwnerUuid,
    branchOwnerEntryTitle: navigationStore.currentBranchOwnerEntryTitle,
    branchBackLink: navigationStore.branchBackLink,
    entriesFilters: {
      filterByTitle: filtersStore.filterByTitle,
      startDate: filtersStore.startDate,
      endDate: filtersStore.endDate,
      selectedOrderBy: filtersStore.selectedOrderBy,
      sortBy: filtersStore.sortBy,
      sortOrder: filtersStore.sortOrder
    },
    page: tableStore.pagination?.current_page || 1,
    activePage: navigationStore.activePage,
    //the map is restored to the question, timeframe and distribution it was showing
    mapView: navigationStore.activePage === 'map'
      ? {
          selectedLocationQuestion: mapStore.selectedLocationQuestion,
          selectedDistributionQuestion: mapStore.selectedDistributionQuestion,
          startDate: mapStore.startDate,
          endDate: mapStore.endDate
        }
      : null,
    ...branchOverrides
  }));
};

export const openAddChildEntry = ({ entryUuid } = {}) => {
  const projectStore = useProjectStore();
  const navigationStore = useNavigationStore();
  const tableStore = useTableStore();
  const formRef = navigationStore.currentFormRef;
  const url = buildAddChildEntryUrl({
    selfLink: tableStore.links?.self || '',
    formRef,
    childFormRef: tableModel.getChildFormRef(projectStore.forms, formRef),
    entryUuid
  });

  //nothing to add the entry to, so leave the stored params untouched
  if (!url) {
    return false;
  }

  saveViewForRestore();
  window.open(url, '_self');

  return true;
};

export const openEditEntry = ({ entryUuid } = {}) => {
  const navigationStore = useNavigationStore();
  const tableStore = useTableStore();
  const mapStore = useMapStore();
  //the map draws its entries from a different endpoint, so the entry is edited
  //from the query the page the user is looking at was requested with
  const selfLink = navigationStore.activePage === 'map'
    ? mapStore.links?.self || ''
    : tableStore.links?.self || '';
  const url = buildEditEntryUrl({
    selfLink,
    entryUuid
  });

  //nothing to edit, so leave the stored params untouched
  if (!url) {
    return false;
  }

  saveViewForRestore();
  window.open(url, '_self');

  return true;
};

//the navbar add button adds to whatever the table is scoped to: the current
//form, the parent entry of a child view, or the owner entry of a branch view
export const buildAddEntryUrl = ({ entriesParams = {} } = {}) => {
  const searchParams = new URLSearchParams();

  Object.keys(entriesParams).forEach((key) => {
    searchParams.set(key, entriesParams[key]);
  });

  if (!searchParams.get('form_ref')) {
    return '';
  }

  return getDataEditorHref(PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH) + '?' + searchParams.toString();
};

export const openAddEntry = () => {
  const tableStore = useTableStore();
  const url = buildAddEntryUrl({ entriesParams: tableStore.buildEntriesParams() });

  //no form to add an entry to, so leave the stored params untouched
  if (!url) {
    return false;
  }

  saveViewForRestore();
  window.open(url, '_self');

  return true;
};

//legacy hides the navbar add action for viewers and for forms with no questions
export const getAddEntryAction = () => {
  const projectStore = useProjectStore();
  const navigationStore = useNavigationStore();
  const projectUser = projectStore.projectUser || {};
  const formRef = navigationStore.currentFormRef;
  const formExtra = projectStore.projectExtra?.forms?.[formRef];
  const hidden = { isVisible: false, label: '' };

  if (!formRef || !formExtra || !canAddEntryForProjectUser()) {
    return hidden;
  }

  if (projectUser.role === PARAMETERS.PROJECT_ROLES.VIEWER) {
    return hidden;
  }

  const branchRef = navigationStore.currentBranchRef;
  const inputRefs = navigationStore.isViewingBranch ? formExtra.branch?.[branchRef] || [] : formExtra.inputs || [];

  //an entry can only be added once the form has questions
  if (!inputRefs.length) {
    return hidden;
  }

  const label = navigationStore.isViewingBranch
    ? projectStore.projectExtra?.inputs?.[branchRef]?.data?.question || ''
    : navigationStore.currentFormName || formExtra.details?.name || '';

  return {
    isVisible: Boolean(label),
    label: label ? helpers.textTruncate(label) : ''
  };
};

export const openAddBranchEntry = ({ entryUuid, branchRef, entryTitle } = {}) => {
  const tableStore = useTableStore();
  const selfLink = tableStore.links?.self || '';
  const url = buildAddBranchEntryUrl({
    selfLink,
    branchRef,
    entryUuid
  });

  //nothing to add the entry to, so leave the stored params untouched
  if (!url) {
    return false;
  }

  saveViewForRestore({
    isViewingBranch: true,
    branchRef,
    branchOwnerUuid: entryUuid,
    branchOwnerEntryTitle: entryTitle || '',
    branchBackLink: selfLink
  });
  window.open(url, '_self');

  return true;
};
