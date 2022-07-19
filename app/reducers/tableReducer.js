import {
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    FETCH_ENTRIES_TABLE_PAGE,
    FETCH_ENTRIES,
    DELETE_ENTRY,
    FETCH_CHILD_ENTRIES,
    FETCH_BRANCH_ENTRIES,
    RESET_BRANCH_NAVIGATION,
    HIERARCHY_NAVIGATE_RESET,
    SET_REVERSE_ENTRIES,
    SET_REVERSE_FAILED_ENTRIES,
    SET_UPLOADED_ROWS,
    FILE_UPLOAD_FILTER_BY_FAILED,
    SET_EXPANDED_ERROR_ROWS,
    SET_BULK_UPLOADABLE_HEADERS,
    SET_GENERATED_UUIDS
} from 'config/actions';
import table from 'utils/table';
import helpers from 'utils/helpers';

const initialState = {
    headers: [],
    rows: [],
    pagination: null,
    links: null,
    isFetchingPage: false,
    isRejectedPage: false,
    isBranchTable: false,
    isFetchingChildren: false,
    isDeletingEntry: false,
    rowIndexToDelete: null,
    uploadedRows: [],
    bulkUploadableHeaders: [],
    reverseEntries: [],
    failedReverseEntries: [],
    reverseMapping: [],
    filterByFailed: false,
    expandedErrorRows: [],
    generatedUuids: []
};

export default function tableReducer(state = initialState, action) {
    switch (action.type) {

        case FETCH_PROJECT_AND_ENTRIES + '_FULFILLED':
            return {
                ...state,
                filterByFailed: false,
                uploadedRows: [],
                bulkUploadableHeaders: [],
                reverseEntries: [],
                failedReverseEntries: [],
                reverseMapping: [],
                expandedErrorRows: [],
                generatedUuids: []
            };
        //action triggered on first page load
        case FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.formRef;
            const entriesExtra = action.payload[0].data;
            const projectExtra = action.meta.projectExtra;

            return {
                ...state,
                //parse entries and create table headers and rows
                headers: table.getHeaders(projectExtra, formRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra),
                pagination: action.payload[0].data.meta,
                links: action.payload[0].data.links,
                isBranchTable: false
            };
        }

        //while restoring, do not show primary navbar until the below fullfills
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_PENDING': {
            //show loader instead of table
            return {
                ...state,
                isFetchingChildren: true
            };
        }
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED': {

            //using the "restored" namespace to avoid 'undefined', as hierarchyNavigatorCopy, see navigationReducer
            const restoredProjectSlug = action.meta.projectSlug;
            const restoredFormRef = action.meta.childFormRef;

            const restoredEntriesExtra = action.payload[0].data; //2 requests at the same time, entries is the request at index 0
            const restoredProjectExtra = action.meta.projectExtra;

            //get branch headers and rows
            return {
                ...state,
                headers: table.getHeaders(restoredProjectExtra, restoredFormRef),
                rows: table.getRows(restoredProjectSlug, restoredProjectExtra, restoredFormRef, restoredEntriesExtra),
                pagination: action.payload[0].data.meta, //2 requests at the same time, entries is the request at index 0
                links: action.payload[0].data.links, //2 requests at the same time, entries is the request at index 0
                isFetchingPage: false,
                isBranchTable: false,
                isFetchingChildren: false
            };
        }

        //fetch branch entries for an entry
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_PENDING': {
            //show loader instead of table
            return {
                ...state,
                isFetchingPage: true
            };
        }
        //fetch branch entries for an entry
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.formRef;
            const branchRef = action.meta.branchRef;
            const entriesExtra = action.payload[0].data;
            const projectExtra = action.meta.projectExtra;

            //get branch headers and rows
            return {
                ...state,
                headers: table.getBranchHeaders(projectExtra, formRef, branchRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra, branchRef),
                pagination: action.payload[0].data.meta,
                links: action.payload[0].data.links,
                isFetchingPage: false,
                isBranchTable: true
            };
        }
        case FETCH_ENTRIES + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.formRef;
            const entriesExtra = action.payload.data;
            const projectExtra = action.meta.projectExtra;

            return {
                ...state,
                //parse entries and create table headers and rows
                headers: table.getHeaders(projectExtra, formRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra),
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isBranchTable: false
            };
        }
        //fetch project first thing
        case FETCH_ENTRIES_TABLE_PAGE + '_PENDING':
            //show loader instead of table
            return {
                ...state,
                isFetchingPage: true
            };
        case FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.formRef;
            const entriesExtra = action.payload.data;
            const projectExtra = action.meta.projectExtra;
            const currentBranchRef = action.meta.currentBranchRef;

            return {
                ...state,
                //get headers or branch headers based on what tablewe are looking at
                headers: currentBranchRef ? table.getBranchHeaders(projectExtra, formRef, currentBranchRef) : table.getHeaders(projectExtra, formRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra, currentBranchRef),
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isFetchingPage: false
            };
        }
        case FETCH_ENTRIES_TABLE_PAGE + '_REJECTED':
            return {
                ...state,
                isFetchingPage: false,
                isRejectedPage: true,
                errors: action.payload.message
            };
        //fetch branch entries for an entry
        case FETCH_BRANCH_ENTRIES + '_PENDING':
            //show loader instead of table
            return {
                ...state,
                isFetchingPage: true
            };
        //fetch branch entries for an entry
        case FETCH_BRANCH_ENTRIES + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.formRef;
            const entriesExtra = action.payload.data;
            const projectExtra = action.meta.projectExtra;

            //get branch headers and rows
            return {
                ...state,
                headers: table.getBranchHeaders(projectExtra, formRef, action.meta.branchRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra, action.meta.branchRef),
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isFetchingPage: false,
                isBranchTable: true,
                filterByFailed: false,
                uploadedRows: [],
                bulkUploadableHeaders: [],
                reverseEntries: [],
                failedReverseEntries: [],
                reverseMapping: [],
                expandedErrorRows: [],
                generatedUuids: []
            };
        }
        //while fetching child entries for an entry
        case FETCH_CHILD_ENTRIES + '_PENDING': {
            //show loader instead of table
            return {
                ...state,
                isFetchingPage: true,
                isFetchingChildren: true
            };
        }
        //fetch child entries for an entry
        case FETCH_CHILD_ENTRIES + '_FULFILLED': {
            const projectSlug = action.meta.projectSlug;
            const formRef = action.meta.nextFormRef;
            const entriesExtra = action.payload.data;
            const projectExtra = action.meta.projectExtra;

            //get child headers and rows
            return {
                ...state,
                headers: table.getHeaders(projectExtra, formRef),
                rows: table.getRows(projectSlug, projectExtra, formRef, entriesExtra),
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isFetchingPage: false,
                isBranchTable: false,
                isFetchingChildren: false,
                filterByFailed: false,
                uploadedRows: [],
                bulkUploadableHeaders: [],
                reverseEntries: [],
                failedReverseEntries: [],
                reverseMapping: [],
                expandedErrorRows: [],
                generatedUuids: []
            };
        }
        case DELETE_ENTRY + '_PENDING': {
            return {
                ...state,
                rowIndexToDelete: action.meta.rowIndexToDelete
            };
        }
        case DELETE_ENTRY + '_FULFILLED': {
            //remove row from table
            const newRows = helpers.removeItem(state.rows, state.rowIndexToDelete);
            //update total
            const newTotal = state.pagination.total - 1;

            return {
                ...state,
                rows: newRows,
                rowIndexToDelete: null,
                pagination: {
                    ...state.pagination,
                    total: newTotal
                }
            };
        }
        case DELETE_ENTRY + '_REJECTED': {
            return {
                ...state,
                rowIndexToDelete: null
            };
        }
        /***************************************************/
        case RESET_BRANCH_NAVIGATION:
            return {
                ...state,
                isBranchTable: false
            };
        case HIERARCHY_NAVIGATE_RESET: {
            return {
                ...state,
                isBranchTable: false
            };
        }
        case SET_REVERSE_ENTRIES: {
            return {
                ...state,
                reverseEntries: action.payload.entries,
                reverseMapping: action.payload.mapping
            };
        }
        case SET_REVERSE_FAILED_ENTRIES: {

            const entries = action.payload.entries;
            const expandedErrorRows = entries.map(() => {
                return false;
            });

            return {
                ...state,
                failedReverseEntries: entries,
                expandedErrorRows
            };
        }
        case SET_UPLOADED_ROWS: {
            return {
                ...state,
                uploadedRows: action.payload.uploadedRows
            };
        }
        case SET_GENERATED_UUIDS: {
            return {
                ...state,
                generatedUuids: action.payload.uuids
            };
        }
        case SET_BULK_UPLOADABLE_HEADERS: {
            return {
                ...state,
                bulkUploadableHeaders: action.payload.headers
            };
        }
        case SET_EXPANDED_ERROR_ROWS: {

            return {
                ...state,
                expandedErrorRows: action.payload.expandedErrorRows
            };
        }
        case FILE_UPLOAD_FILTER_BY_FAILED: {
            return {
                ...state,
                filterByFailed: action.payload.status
                //also reste pagination
            };
        }
        default:
            return state;
    }
}
