/*
 Take care of navigation:
 - map/table switch
 - table parent -> child navigation
 */
import {
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    TOGGLE_ACTIVE_PAGE,
    FETCH_ENTRIES,
    FETCH_BRANCH_ENTRIES,
    FETCH_CHILD_ENTRIES,
    FETCH_ENTRIES_LOCATIONS,
    RESET_BRANCH_NAVIGATION,
    HIERARCHY_NAVIGATE_BACK,
    HIERARCHY_NAVIGATE_RESET,
    PROGRESS_BAR_UPDATE,
    TOGGLE_WAIT_OVERLAY
} from 'config/actions';

import PARAMETERS from 'config/parameters';

const initialState = {
    hierarchyNavigator: [{
        formRef: null,
        formName: null,
        parentEntryTitle: null,
        parentEntryUuid: null,
        entryUuid: null,
        selfLink: null
    }],
    currentFormRef: null,
    currentBranchRef: null,
    currentBranchOwnerEntryTitle: null,
    branchBackLink: null,
    currentFormName: null,
    isPerformingLongAction: false,
    isFetching: false,
    isRejected: false,
    activePage: PARAMETERS.PAGE_TABLE,
    isViewingChildren: false,
    isViewingBranch: false,
    isFirstMapLoad: true,
    isRestoring: false
};

let hierarchyNavigatorCopy; //declared here as if  have the same constant declared twice, the second one will return undefined...maybe Babel issue

export default function navigationReducer(state = initialState, action) {

    switch (action.type) {

        case TOGGLE_WAIT_OVERLAY: {
            return {
                ...state,
                isPerformingLongAction: action.payload.show
            };
        }

        case FETCH_PROJECT_AND_ENTRIES + '_PENDING': {
            return {
                ...state,
                isRestoring: action.meta.shouldRestoreParams !== null
            };
        }
        //on initial page load, set first form ref as the selected one
        case FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            //when getting entries for a form, if we do that
            //from the "table" page, set isFirstMapLoad to true
            //to trigger an update when switching to the map view
            //...common leaflet bug

            //it should work whne we go directly to the map view
            //for example after an edit from the map

            //get current self link for the entries loaded
            ////we need it for backward table navigation when navigating to children
            const selfLink = action.payload[0].data.links.self;
            const formRef = action.meta.formRef;
            const formName = action.meta.formName;
            const activePage = action.meta.activePage || state.activePage;
            //deep copy array
            const hierarchyNavigator = JSON.parse(JSON.stringify(state.hierarchyNavigator));

            //top level form
            hierarchyNavigator[0] = {
                formRef,
                formName,
                parentEntryTitle: null,
                entryUuid: null,
                selfLink
            };

            return {
                ...state,
                currentFormRef: formRef,
                currentFormName: action.meta.formName,
                isFirstMapLoad: true,
                hierarchyNavigator,
                activePage,
                isRestoring: false
            };
        }

        //this is called only when we are restring after add/edit entry
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            //using the "restored" namespace to avoid 'undefined', as hierarchyNavigatorCopy, see above
            const restoredHierarchyNavigator = action.meta.hierarchyNavigator;
            const restoredFormRef = restoredHierarchyNavigator[0].formRef;
            const restoredFormName = restoredHierarchyNavigator[0].formName;

            return {
                ...state,
                currentFormRef: restoredFormRef,
                currentFormName: restoredFormName,
                //when getting entries for a form, if we do that
                //from the "table" page, set isFirstMapLoad to true
                //to trigger an update when switching to the map view
                //...common leaflet bug -> height not set -> grey tiles
                isFirstMapLoad: true,
                hierarchyNavigator: restoredHierarchyNavigator,
                isViewingChildren: true,
                isRestoring: false
            };
        }

        //fetch entries and entries-locations
        case FETCH_ENTRIES + '_PENDING':
            return {
                ...state,
                isFetching: true,
                isRejected: false
            };
        case FETCH_ENTRIES_LOCATIONS + '_PENDING': {
            return {
                ...state,
                isPerformingLongAction: true
            };
        }
        case FETCH_ENTRIES_LOCATIONS + '_FULFILLED': {
            return {
                ...state,
                isPerformingLongAction: false
            };
        }
        case FETCH_ENTRIES + '_FULFILLED': {
            //get current self link for the entries loaded
            ////we need it for backward table navigation when navigating to children
            const selfLink = action.payload.data.links.self;
            const formRef = action.meta.formRef;
            const formName = action.meta.formName;
            //deep copy array
            const hierarchyNavigator = JSON.parse(JSON.stringify(state.hierarchyNavigator));

            //top level form
            hierarchyNavigator[0] = {
                formRef,
                formName,
                parentEntryTitle: null,
                entryUuid: null,
                selfLink
            };

            if (state.activePage === PARAMETERS.PAGE_TABLE) {
                return {
                    ...state,
                    currentFormRef: formRef,
                    currentFormName: formName,
                    isFirstMapLoad: true,
                    isFetching: false,
                    isRestoring: false,
                    hierarchyNavigator
                };
            }
            return {
                ...state,
                currentFormRef: formRef,
                currentFormName: formName,
                isFetching: false,
                isRestoring: false
            };
        }
        //fetch branch entries for an entry
        case FETCH_BRANCH_ENTRIES + '_FULFILLED': {
            const currentBranchRef = action.meta.branchRef;
            const currentBranchOwnerUuid = action.meta.ownerEntryUuid;
            const currentBranchOwnerEntryTitle = action.meta.entryTitle;
            const branchBackLink = action.meta.branchBackLink;

            return {
                ...state,
                isViewingBranch: true,
                currentBranchRef,
                currentBranchOwnerUuid,
                currentBranchOwnerEntryTitle,
                branchBackLink
            };
        }

        //restore branch entries view
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {

            const restoredCurrentBranchRef = action.meta.branchRef;
            const restoredCurrentFormRef = action.meta.formRef;
            const restoredCurrentFormName = action.meta.restoredFormName;
            const restoredCurrentBranchOwnerUuid = action.meta.ownerEntryUuid;
            const restoredCurrentBranchOwnerEntryTitle = action.meta.entryTitle;
            const restoredBranchBackLink = action.meta.branchBackLink;
            const restoredIsViewingChildren = action.meta.isViewingChildren;
            const restoredHierarchyNavigator = action.meta.hierarchyNavigator;

            return {
                ...state,
                isViewingBranch: true,
                isViewingChildren: restoredIsViewingChildren,
                hierarchyNavigator: restoredHierarchyNavigator,
                currentFormRef: restoredCurrentFormRef,
                currentBranchRef: restoredCurrentBranchRef,
                currentFormName: restoredCurrentFormName,
                currentBranchOwnerUuid: restoredCurrentBranchOwnerUuid,
                currentBranchOwnerEntryTitle: restoredCurrentBranchOwnerEntryTitle,
                branchBackLink: restoredBranchBackLink,
                isRestoring: false
            };
        }
        //while fetching child entries for an entry
        case FETCH_CHILD_ENTRIES + '_PENDING': {
            //show loader instead of table
            return {
                ...state,
                isViewingChildren: false
            };
        }
        //fetch branch entries for an entry
        case FETCH_CHILD_ENTRIES + '_FULFILLED': {
            //get parent title
            const parentEntryTitle = action.meta.parentEntryTitle;
            const parentEntryUuid = action.meta.parentEntryUuid;
            //get current child entries self link for navigation
            const selfLink = action.payload.data.links.self;
            ////we need it for backward table navigation when navigating to children
            const formRef = action.meta.nextFormRef;
            const formName = action.meta.nextFormName;
            const isActionAfterBulkUpload = action.meta.isActionAfterBulkUpload;

            hierarchyNavigatorCopy = JSON.parse(JSON.stringify(state.hierarchyNavigator));

            //add current children view to navigation only when is a user navigation and not when closing the bulk upload modal
            if (!isActionAfterBulkUpload) {
                hierarchyNavigatorCopy.push({
                    formRef,
                    formName,
                    parentEntryTitle,
                    entryUuid: null,
                    parentEntryUuid,
                    selfLink
                });
            }

            return {
                ...state,
                isViewingChildren: true,
                hierarchyNavigator: hierarchyNavigatorCopy
            };
        }
        case TOGGLE_ACTIVE_PAGE:
            //force a re-render of the map component to fix the grey tiles problem with leaflet
            //do this each time a form is loaded
            if (state.isFirstMapLoad) {
                return {
                    ...state,
                    activePage: action.payload,
                    isFirstMapLoad: false
                };
            }
            return {
                ...state,
                activePage: action.payload
            };
        case RESET_BRANCH_NAVIGATION:
            return {
                ...state,
                currentBranchRef: null,
                currentBranchOwnerEntryTitle: null,
                branchBackLink: null,
                isViewingBranch: false
            };
        //navigate back the children hierarchy
        case HIERARCHY_NAVIGATE_BACK: {
            hierarchyNavigatorCopy = JSON.parse(JSON.stringify(state.hierarchyNavigator));
            //remove last children parameters
            hierarchyNavigatorCopy.pop();
            return {
                ...state,
                hierarchyNavigator: hierarchyNavigatorCopy
            };
        }
        //reste hierarchy navigation leaving onlt the top parent form in (at index 0)
        case HIERARCHY_NAVIGATE_RESET: {
            hierarchyNavigatorCopy = JSON.parse(JSON.stringify(state.hierarchyNavigator));
            hierarchyNavigatorCopy.length = 1;

            return {
                ...state,
                hierarchyNavigator: hierarchyNavigatorCopy,
                isViewingChildren: false,
                isViewingBranch: false,
                currentFormRef: action.payload.previousFormRef
            };
        }
        case PROGRESS_BAR_UPDATE: {
            const progressBarIsVisible = action.payload.progressBarIsVisible;

            if (state.activePage === PARAMETERS.PAGE_MAP) {
                return {
                    ...state,
                    isPerformingLongAction: progressBarIsVisible
                };
            }
            return {
                ...state
            };
        }
        default:
            return state;
    }
}
