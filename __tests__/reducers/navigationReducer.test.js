import navigationReducer from 'reducers/navigationReducer';
import PARAMETERS from 'config/parameters';
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

const SELF_LINK = 'https://five.epicollect.net/api/internal/entries/a-project';

const stateWithTwoLevels = {
    ...initialState,
    hierarchyNavigator: [
        { formRef: 'form-1', formName: 'Form 1', parentEntryTitle: null, entryUuid: null, selfLink: SELF_LINK },
        { formRef: 'form-2', formName: 'Form 2', parentEntryTitle: 'Parent title', parentEntryUuid: 'parent-uuid', entryUuid: null, selfLink: SELF_LINK }
    ],
    currentFormRef: 'form-2',
    currentFormName: 'Form 2',
    isViewingChildren: true
};

describe('navigation reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = navigationReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = navigationReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should show and hide the wait overlay', () => {
        const state = navigationReducer(initialState, {
            type: TOGGLE_WAIT_OVERLAY,
            payload: { show: true }
        });
        expect(state.isPerformingLongAction).toBe(true);

        const hiddenState = navigationReducer(state, {
            type: TOGGLE_WAIT_OVERLAY,
            payload: { show: false }
        });
        expect(hiddenState.isPerformingLongAction).toBe(false);
    });

    it('should not be restoring when there are no restore params', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_PENDING',
            meta: { shouldRestoreParams: null }
        });
        expect(state.isRestoring).toBe(false);
    });

    it('should be restoring when there are restore params', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_PENDING',
            meta: { shouldRestoreParams: { formRef: 'form-1' } }
        });
        expect(state.isRestoring).toBe(true);
    });

    it('should set the top level form when the entries and locations are loaded', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: { links: { self: SELF_LINK } } }],
            meta: {
                formRef: 'form-1',
                formName: 'Form 1',
                activePage: PARAMETERS.PAGE_MAP
            }
        });

        expect(state.currentFormRef).toBe('form-1');
        expect(state.currentFormName).toBe('Form 1');
        expect(state.isFirstMapLoad).toBe(true);
        expect(state.activePage).toBe(PARAMETERS.PAGE_MAP);
        expect(state.isRestoring).toBe(false);
        expect(state.hierarchyNavigator[0]).toEqual({
            formRef: 'form-1',
            formName: 'Form 1',
            parentEntryTitle: null,
            entryUuid: null,
            selfLink: SELF_LINK
        });
    });

    it('should keep the current page when the action has no active page', () => {
        const state = navigationReducer({
            ...initialState,
            activePage: PARAMETERS.PAGE_MAP
        }, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: { links: { self: SELF_LINK } } }],
            meta: { formRef: 'form-1', formName: 'Form 1' }
        });

        expect(state.activePage).toBe(PARAMETERS.PAGE_MAP);
    });

    it('should restore the child entries hierarchy', () => {
        const hierarchyNavigator = [
            { formRef: 'form-1', formName: 'Form 1', selfLink: SELF_LINK },
            { formRef: 'form-2', formName: 'Form 2', selfLink: SELF_LINK }
        ];

        const state = navigationReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            meta: { hierarchyNavigator }
        });

        expect(state.currentFormRef).toBe('form-1');
        expect(state.currentFormName).toBe('Form 1');
        expect(state.isViewingChildren).toBe(true);
        expect(state.isFirstMapLoad).toBe(true);
        expect(state.isRestoring).toBe(false);
        expect(state.hierarchyNavigator).toEqual(hierarchyNavigator);
    });

    it('should flag the fetching when the entries are requested', () => {
        const state = navigationReducer({
            ...initialState,
            isRejected: true
        }, {
            type: FETCH_ENTRIES + '_PENDING'
        });

        expect(state.isFetching).toBe(true);
        expect(state.isRejected).toBe(false);
    });

    it('should flag the long action while the locations are requested', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_ENTRIES_LOCATIONS + '_PENDING'
        });
        expect(state.isPerformingLongAction).toBe(true);

        const doneState = navigationReducer(state, {
            type: FETCH_ENTRIES_LOCATIONS + '_FULFILLED'
        });
        expect(doneState.isPerformingLongAction).toBe(false);
    });

    it('should set the top level form when the entries are loaded on the table page', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_ENTRIES + '_FULFILLED',
            payload: { data: { links: { self: SELF_LINK } } },
            meta: { formRef: 'form-1', formName: 'Form 1' }
        });

        expect(state.currentFormRef).toBe('form-1');
        expect(state.currentFormName).toBe('Form 1');
        expect(state.isFirstMapLoad).toBe(true);
        expect(state.isFetching).toBe(false);
        expect(state.hierarchyNavigator[0].formRef).toBe('form-1');
    });

    it('should not touch the first map load nor the hierarchy navigator on the map page', () => {
        const state = navigationReducer({
            ...initialState,
            activePage: PARAMETERS.PAGE_MAP
        }, {
            type: FETCH_ENTRIES + '_FULFILLED',
            payload: { data: { links: { self: SELF_LINK } } },
            meta: { formRef: 'form-1', formName: 'Form 1' }
        });

        //the current form is set on both pages, but the map page leaves
        //the first map load and the hierarchy navigator alone
        expect(state.currentFormRef).toBe('form-1');
        expect(state.currentFormName).toBe('Form 1');
        expect(state.isFirstMapLoad).toBe(true);
        expect(state.isFetching).toBe(false);
        expect(state.hierarchyNavigator[0].formRef).toBe(null);
    });

    it('should set the branch details when the branch entries are loaded', () => {
        const state = navigationReducer(initialState, {
            type: FETCH_BRANCH_ENTRIES + '_FULFILLED',
            meta: {
                branchRef: 'branch-1',
                ownerEntryUuid: 'owner-uuid',
                entryTitle: 'Owner title',
                branchBackLink: SELF_LINK
            }
        });

        expect(state.isViewingBranch).toBe(true);
        expect(state.currentBranchRef).toBe('branch-1');
        expect(state.currentBranchOwnerUuid).toBe('owner-uuid');
        expect(state.currentBranchOwnerEntryTitle).toBe('Owner title');
        expect(state.branchBackLink).toBe(SELF_LINK);
    });

    it('should restore the branch details', () => {
        const hierarchyNavigator = [
            { formRef: 'form-1', formName: 'Form 1', selfLink: SELF_LINK }
        ];

        const state = navigationReducer(initialState, {
            type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            meta: {
                branchRef: 'branch-1',
                formRef: 'form-1',
                restoredFormName: 'Form 1',
                ownerEntryUuid: 'owner-uuid',
                entryTitle: 'Owner title',
                branchBackLink: SELF_LINK,
                isViewingChildren: false,
                hierarchyNavigator
            }
        });

        expect(state.isViewingBranch).toBe(true);
        expect(state.isViewingChildren).toBe(false);
        expect(state.currentBranchRef).toBe('branch-1');
        expect(state.currentFormRef).toBe('form-1');
        expect(state.currentFormName).toBe('Form 1');
        expect(state.currentBranchOwnerUuid).toBe('owner-uuid');
        expect(state.currentBranchOwnerEntryTitle).toBe('Owner title');
        expect(state.branchBackLink).toBe(SELF_LINK);
        expect(state.hierarchyNavigator).toEqual(hierarchyNavigator);
        expect(state.isRestoring).toBe(false);
    });

    it('should hide the children while they are being fetched', () => {
        const state = navigationReducer({
            ...initialState,
            isViewingChildren: true
        }, {
            type: FETCH_CHILD_ENTRIES + '_PENDING'
        });

        expect(state.isViewingChildren).toBe(false);
    });

    it('should push the child form on the hierarchy navigator', () => {
        const state = navigationReducer(stateWithTwoLevels, {
            type: FETCH_CHILD_ENTRIES + '_FULFILLED',
            payload: { data: { links: { self: SELF_LINK } } },
            meta: {
                parentEntryTitle: 'Parent title',
                parentEntryUuid: 'parent-uuid',
                nextFormRef: 'form-3',
                nextFormName: 'Form 3',
                isActionAfterBulkUpload: false
            }
        });

        expect(state.isViewingChildren).toBe(true);
        expect(state.hierarchyNavigator).toHaveLength(3);
        expect(state.hierarchyNavigator[2]).toEqual({
            formRef: 'form-3',
            formName: 'Form 3',
            parentEntryTitle: 'Parent title',
            entryUuid: null,
            parentEntryUuid: 'parent-uuid',
            selfLink: SELF_LINK
        });
    });

    it('should not push the child form when the action follows a bulk upload', () => {
        const state = navigationReducer(stateWithTwoLevels, {
            type: FETCH_CHILD_ENTRIES + '_FULFILLED',
            payload: { data: { links: { self: SELF_LINK } } },
            meta: {
                parentEntryTitle: 'Parent title',
                parentEntryUuid: 'parent-uuid',
                nextFormRef: 'form-3',
                nextFormName: 'Form 3',
                isActionAfterBulkUpload: true
            }
        });

        expect(state.hierarchyNavigator).toHaveLength(2);
    });

    it('should switch the active page and consume the first map load', () => {
        const state = navigationReducer(initialState, {
            type: TOGGLE_ACTIVE_PAGE,
            payload: PARAMETERS.PAGE_MAP
        });

        expect(state.activePage).toBe(PARAMETERS.PAGE_MAP);
        expect(state.isFirstMapLoad).toBe(false);
    });

    it('should reset the branch navigation', () => {
        const state = navigationReducer({
            ...initialState,
            currentBranchRef: 'branch-1',
            currentBranchOwnerEntryTitle: 'Owner title',
            branchBackLink: SELF_LINK,
            isViewingBranch: true
        }, {
            type: RESET_BRANCH_NAVIGATION
        });

        expect(state.currentBranchRef).toBe(null);
        expect(state.currentBranchOwnerEntryTitle).toBe(null);
        expect(state.branchBackLink).toBe(null);
        expect(state.isViewingBranch).toBe(false);
    });

    it('should pop the last level of the hierarchy navigator', () => {
        const state = navigationReducer(stateWithTwoLevels, {
            type: HIERARCHY_NAVIGATE_BACK
        });

        expect(state.hierarchyNavigator).toHaveLength(1);
        expect(state.hierarchyNavigator[0].formRef).toBe('form-1');
    });

    it('should reset the hierarchy navigator to the top level form', () => {
        const state = navigationReducer({
            ...stateWithTwoLevels,
            isViewingBranch: true
        }, {
            type: HIERARCHY_NAVIGATE_RESET,
            payload: { previousFormRef: 'form-1' }
        });

        expect(state.hierarchyNavigator).toHaveLength(1);
        expect(state.hierarchyNavigator[0].formRef).toBe('form-1');
        expect(state.isViewingChildren).toBe(false);
        expect(state.isViewingBranch).toBe(false);
        expect(state.currentFormRef).toBe('form-1');
    });

    it('should update the long action on the map page', () => {
        const state = navigationReducer({
            ...initialState,
            activePage: PARAMETERS.PAGE_MAP
        }, {
            type: PROGRESS_BAR_UPDATE,
            payload: { progressBarIsVisible: true }
        });

        expect(state.isPerformingLongAction).toBe(true);
    });

    it('should not update the long action on the table page', () => {
        const state = navigationReducer(initialState, {
            type: PROGRESS_BAR_UPDATE,
            payload: { progressBarIsVisible: true }
        });

        expect(state.isPerformingLongAction).toBe(false);
    });
});
