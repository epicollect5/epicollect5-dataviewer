import modalReducer from 'reducers/modalReducer';
import PARAMETERS from 'config/parameters';
import {
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_BRANCH_ENTRIES,
    FETCH_CHILD_ENTRIES,
    TOGGLE_MODAL_DELETE_ENTRY,
    TOGGLE_MODAL_VIEW_ENTRY,
    TOGGLE_MODAL_UPLOAD_ENTRIES,
    TOGGLE_MODAL_PREPARE_DOWNLOAD,
    UPLOAD_TABLE_PAGINATION_STATE,
    DELETE_ENTRY,
    FILE_UPLOAD_FILTER_BY_FAILED
} from 'config/actions';

const initialState = {
    showModalUploadEntries: false,
    showModalDeleteEntry: false,
    showModalViewEntry: false,
    showModalDeleteLoader: false,
    showModalPrepareDownload: false,
    entryUuid: null,
    entryTitle: null,
    deleteEntryTitle: null,
    deleteEntryExtra: null,
    deleteEntryFulfilled: false,
    deleteEntryRejected: false,
    viewHeaders: null,
    viewAnswers: null,
    rowIndexToDelete: null,
    reverseEntries: [],
    uploadTablePageStart: 0,
    uploadTablePageEnd: 1,
    uploadTablePerPage: PARAMETERS.TABLE_UPLOAD_PER_PAGE,
    uploadTablePrevBtnEnabled: false,
    uploadTableNextBtnEnabled: true
};

describe('modal reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = modalReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = modalReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should toggle the delete entry modal and store its payload', () => {
        const state = modalReducer(initialState, {
            type: TOGGLE_MODAL_DELETE_ENTRY,
            payload: {
                entryUuid: 'an-uuid',
                entryTitle: 'a title',
                entryExtra: { some: 'extra' },
                rowIndex: 3
            }
        });

        expect(state.showModalDeleteEntry).toBe(true);
        expect(state.entryUuid).toBe('an-uuid');
        expect(state.deleteEntryTitle).toBe('a title');
        expect(state.deleteEntryExtra).toEqual({ some: 'extra' });
        expect(state.rowIndexToDelete).toBe(3);
    });

    it('should close the delete entry modal when toggled again', () => {
        const state = modalReducer({
            ...initialState,
            showModalDeleteEntry: true
        }, {
            type: TOGGLE_MODAL_DELETE_ENTRY,
            payload: {}
        });

        expect(state.showModalDeleteEntry).toBe(false);
    });

    it('should null the delete entry payload when it is missing', () => {
        const state = modalReducer(initialState, {
            type: TOGGLE_MODAL_DELETE_ENTRY,
            payload: {}
        });

        expect(state.entryUuid).toBe(null);
        expect(state.deleteEntryTitle).toBe(null);
        expect(state.deleteEntryExtra).toBe(null);
    });

    it('should toggle the upload entries modal and reset its pagination', () => {
        const state = modalReducer({
            ...initialState,
            uploadTablePageStart: 5,
            uploadTablePageEnd: 10,
            uploadTablePrevBtnEnabled: true,
            uploadTableNextBtnEnabled: false
        }, {
            type: TOGGLE_MODAL_UPLOAD_ENTRIES
        });

        expect(state.showModalUploadEntries).toBe(true);
        expect(state.uploadTablePageStart).toBe(0);
        expect(state.uploadTablePageEnd).toBe(1);
        expect(state.uploadTablePrevBtnEnabled).toBe(false);
        expect(state.uploadTableNextBtnEnabled).toBe(true);
    });

    it('should open the view entry modal with its payload', () => {
        const headers = [{ question: 'a question' }];
        const answers = { 'text-ref': 'an answer' };

        const state = modalReducer(initialState, {
            type: TOGGLE_MODAL_VIEW_ENTRY,
            payload: { headers, answers, entryTitle: 'a title' }
        });

        expect(state.showModalViewEntry).toBe(true);
        expect(state.viewHeaders).toEqual(headers);
        expect(state.viewAnswers).toEqual(answers);
        expect(state.entryTitle).toBe('a title');
    });

    it('should close the view entry modal and clear its payload', () => {
        const state = modalReducer({
            ...initialState,
            showModalViewEntry: true,
            viewHeaders: [{ question: 'a question' }],
            viewAnswers: { 'text-ref': 'an answer' },
            entryTitle: 'a title'
        }, {
            type: TOGGLE_MODAL_VIEW_ENTRY,
            payload: { headers: [], answers: {}, entryTitle: '' }
        });

        expect(state.showModalViewEntry).toBe(false);
        expect(state.viewHeaders).toBe(null);
        expect(state.viewAnswers).toBe(null);
        expect(state.entryTitle).toBe(null);
    });

    it('should toggle the prepare download modal', () => {
        const state = modalReducer(initialState, {
            type: TOGGLE_MODAL_PREPARE_DOWNLOAD,
            payload: true
        });

        expect(state.showModalPrepareDownload).toBe(true);
    });

    it('should show the delete loader while the entry is being deleted', () => {
        const state = modalReducer(initialState, {
            type: DELETE_ENTRY + '_PENDING',
            meta: { rowIndexToDelete: 2 }
        });

        expect(state.showModalDeleteLoader).toBe(true);
    });

    it('should close the delete modal when the entry is deleted', () => {
        const state = modalReducer({
            ...initialState,
            showModalDeleteEntry: true,
            showModalDeleteLoader: true,
            entryUuid: 'an-uuid',
            deleteEntryTitle: 'a title',
            deleteEntryExtra: { some: 'extra' }
        }, {
            type: DELETE_ENTRY + '_FULFILLED'
        });

        expect(state.showModalDeleteEntry).toBe(false);
        expect(state.showModalDeleteLoader).toBe(false);
        expect(state.entryUuid).toBe(null);
        expect(state.deleteEntryTitle).toBe(null);
        expect(state.deleteEntryExtra).toBe(null);
        expect(state.isDeletingEntry).toBe(false);
    });

    it('should close the delete modal when the entry could not be deleted', () => {
        const state = modalReducer({
            ...initialState,
            showModalDeleteEntry: true,
            showModalDeleteLoader: true,
            entryUuid: 'an-uuid',
            deleteEntryTitle: 'a title',
            deleteEntryExtra: { some: 'extra' }
        }, {
            type: DELETE_ENTRY + '_REJECTED'
        });

        expect(state.showModalDeleteEntry).toBe(false);
        expect(state.showModalDeleteLoader).toBe(false);
        expect(state.entryUuid).toBe(null);
        expect(state.deleteEntryTitle).toBe(null);
        expect(state.deleteEntryExtra).toBe(null);
        expect(state.isDeletingEntry).toBe(false);
    });

    it('should set the upload table pagination state', () => {
        const state = modalReducer(initialState, {
            type: UPLOAD_TABLE_PAGINATION_STATE,
            payload: {
                pageStart: 10,
                pageEnd: 20,
                nextBtnEnabled: true,
                prevBtnEnabled: true
            }
        });

        expect(state.uploadTablePageStart).toBe(10);
        expect(state.uploadTablePageEnd).toBe(20);
        expect(state.uploadTableNextBtnEnabled).toBe(true);
        expect(state.uploadTablePrevBtnEnabled).toBe(true);
    });

    it('should reset the upload table pagination when filtering by failed', () => {
        const state = modalReducer({
            ...initialState,
            uploadTablePageStart: 10,
            uploadTablePageEnd: 20,
            uploadTablePrevBtnEnabled: true,
            uploadTableNextBtnEnabled: false
        }, {
            type: FILE_UPLOAD_FILTER_BY_FAILED,
            payload: { status: true }
        });

        expect(state.uploadTablePageStart).toBe(0);
        expect(state.uploadTablePageEnd).toBe(1);
        expect(state.uploadTablePrevBtnEnabled).toBe(false);
        expect(state.uploadTableNextBtnEnabled).toBe(true);
    });

    it('should close the upload entries modal when the child entries are fetched', () => {
        const state = modalReducer({
            ...initialState,
            showModalUploadEntries: true
        }, {
            type: FETCH_CHILD_ENTRIES + '_FULFILLED'
        });

        expect(state.showModalUploadEntries).toBe(false);
    });

    it('should close the upload entries modal when the branch entries are fetched', () => {
        const state = modalReducer({
            ...initialState,
            showModalUploadEntries: true
        }, {
            type: FETCH_BRANCH_ENTRIES + '_FULFILLED'
        });

        expect(state.showModalUploadEntries).toBe(false);
    });

    it('should close the upload entries modal when the project is loaded', () => {
        const state = modalReducer({
            ...initialState,
            showModalUploadEntries: true
        }, {
            type: FETCH_PROJECT_AND_ENTRIES + '_FULFILLED'
        });

        expect(state.showModalUploadEntries).toBe(false);
    });
});
