import {
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_BRANCH_ENTRIES,
    TOGGLE_MODAL_DELETE_ENTRY,
    TOGGLE_MODAL_VIEW_ENTRY,
    TOGGLE_MODAL_UPLOAD_ENTRIES,
    TOGGLE_MODAL_PREPARE_DOWNLOAD,
    UPLOAD_TABLE_PAGINATION_STATE,
    DELETE_ENTRY,
    FILE_UPLOAD_FILTER_BY_FAILED,
    FETCH_CHILD_ENTRIES
} from 'config/actions';
import PARAMETERS from 'config/parameters';

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

export default function modalReducer(state = initialState, action) {

    switch (action.type) {

        case FETCH_CHILD_ENTRIES + '_FULFILLED': {
            return {
                ...state,
                showModalUploadEntries: false
            };
        }

        //reset pagination when filter by failed checkbox is toggled
        case FILE_UPLOAD_FILTER_BY_FAILED: {
            return {
                ...state,
                uploadTablePageStart: 0,
                uploadTablePageEnd: 1,
                uploadTablePrevBtnEnabled: false,
                uploadTableNextBtnEnabled: true
            };
        }
        case FETCH_PROJECT_AND_ENTRIES + '_FULFILLED':
            return {
                ...state,
                showModalUploadEntries: false
            };
        case FETCH_BRANCH_ENTRIES + '_FULFILLED':
            return {
                ...state,
                showModalUploadEntries: false
            };
        case TOGGLE_MODAL_DELETE_ENTRY: {
            return {
                ...state,
                showModalDeleteEntry: !state.showModalDeleteEntry,
                entryUuid: action.payload.entryUuid || null,
                deleteEntryTitle: action.payload.entryTitle || null,
                deleteEntryExtra: action.payload.entryExtra || null,
                rowIndexToDelete: action.payload.rowIndex
            };
        }
        case TOGGLE_MODAL_UPLOAD_ENTRIES: {
            return {
                ...state,
                showModalUploadEntries: !state.showModalUploadEntries,
                uploadTablePageStart: 0,
                uploadTablePageEnd: 1,
                uploadTablePrevBtnEnabled: false,
                uploadTableNextBtnEnabled: true
            };
        }
        case TOGGLE_MODAL_VIEW_ENTRY: {
            if (state.showModalViewEntry) {
                //closing modal
                return {
                    ...state,
                    showModalViewEntry: false,
                    viewAnswers: null,
                    viewHeaders: null,
                    entryTitle: null
                };
            }
            return {
                //opening modal
                ...state,
                showModalViewEntry: true,
                viewAnswers: action.payload.answers,
                viewHeaders: action.payload.headers,
                entryTitle: action.payload.entryTitle
            };
        }

        case TOGGLE_MODAL_PREPARE_DOWNLOAD: {
            return {
                ...state,
                showModalPrepareDownload: !state.showModalPrepareDownload
            };
        }

        case DELETE_ENTRY + '_PENDING': {
            return {
                ...state,
                showModalDeleteLoader: true
            };
        }
        case DELETE_ENTRY + '_FULFILLED': {
            return {
                ...state,
                entryUuid: null,
                deleteEntryTitle: null,
                deleteEntryExtra: null,
                isDeletingEntry: false,
                showModalDeleteEntry: false,
                showModalDeleteLoader: false
            };
        }
        case DELETE_ENTRY + '_REJECTED': {
            return {
                ...state,
                entryUuid: null,
                deleteEntryTitle: null,
                deleteEntryExtra: null,
                isDeletingEntry: false,
                showModalDeleteEntry: false,
                showModalDeleteLoader: false
            };
        }
        case UPLOAD_TABLE_PAGINATION_STATE:
            return {
                ...state,
                uploadTablePageStart: action.payload.pageStart,
                uploadTablePageEnd: action.payload.pageEnd,
                uploadTableNextBtnEnabled: action.payload.nextBtnEnabled,
                uploadTablePrevBtnEnabled: action.payload.prevBtnEnabled
            };
        default:
            return state;
    }
}
