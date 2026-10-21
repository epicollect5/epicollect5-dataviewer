jest.mock('utils/table', () => ({
    getHeaders: jest.fn(() => ['a header']),
    getBranchHeaders: jest.fn(() => ['a branch header']),
    getRows: jest.fn(() => [['a row']])
}));

import tableReducer from 'reducers/tableReducer';
import table from 'utils/table';
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

const projectExtra = { inputs: {}, forms: {} };
//the reducer hands action.payload.data over to utils/table.getRows
const entriesData = { entries: [] };
const dataWithMeta = { ...entriesData, meta: { total: 1 }, links: { self: 'a link' } };
const dataPlain = { ...entriesData, meta: {}, links: {} };

const dirtyBulkUploadState = {
    ...initialState,
    filterByFailed: true,
    uploadedRows: [{ a: 'row' }],
    bulkUploadableHeaders: ['a header'],
    reverseEntries: [{ an: 'entry' }],
    failedReverseEntries: [{ a: 'failed entry' }],
    reverseMapping: [{ a: 'mapping' }],
    expandedErrorRows: [true],
    generatedUuids: ['a uuid']
};

describe('table reducer test', () => {

    beforeEach(() => {
        table.getHeaders.mockClear();
        table.getBranchHeaders.mockClear();
        table.getRows.mockClear();
    });

    it('should return the initial state for an unknown action', () => {
        const state = tableReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = tableReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should reset the bulk upload state when the project is loaded', () => {
        const state = tableReducer(dirtyBulkUploadState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_FULFILLED'
        });

        expect(state.filterByFailed).toBe(false);
        expect(state.uploadedRows).toEqual([]);
        expect(state.bulkUploadableHeaders).toEqual([]);
        expect(state.reverseEntries).toEqual([]);
        expect(state.failedReverseEntries).toEqual([]);
        expect(state.reverseMapping).toEqual([]);
        expect(state.expandedErrorRows).toEqual([]);
        expect(state.generatedUuids).toEqual([]);
    });

    it('should build the headers and the rows when the entries and locations are loaded', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: dataWithMeta }],
            meta: { projectSlug: 'a-project', formRef: 'form-1', projectExtra }
        });

        expect(table.getHeaders).toHaveBeenCalledWith(projectExtra, 'form-1');
        expect(table.getRows).toHaveBeenCalledWith('a-project', projectExtra, 'form-1', dataWithMeta);
        expect(state.headers).toEqual(['a header']);
        expect(state.rows).toEqual([['a row']]);
        expect(state.pagination).toEqual({ total: 1 });
        expect(state.links).toEqual({ self: 'a link' });
        expect(state.isBranchTable).toBe(false);
    });

    it('should show the loader while the child entries are being restored', () => {
        const state = tableReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_PENDING'
        });

        expect(state.isFetchingChildren).toBe(true);
    });

    it('should build the headers and the rows when the child entries are restored', () => {
        const state = tableReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: dataPlain }],
            meta: { projectSlug: 'a-project', childFormRef: 'form-2', projectExtra }
        });

        expect(table.getHeaders).toHaveBeenCalledWith(projectExtra, 'form-2');
        expect(table.getRows).toHaveBeenCalledWith('a-project', projectExtra, 'form-2', dataPlain);
        expect(state.isFetchingChildren).toBe(false);
        expect(state.isBranchTable).toBe(false);
    });

    it('should show the loader while the branch entries are being restored', () => {
        const state = tableReducer(initialState, {
            type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_PENDING'
        });

        expect(state.isFetchingPage).toBe(true);
    });

    it('should build the branch headers and the rows when the branch entries are restored', () => {
        const state = tableReducer(initialState, {
            type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: dataPlain }],
            meta: { projectSlug: 'a-project', formRef: 'form-1', branchRef: 'branch-1', projectExtra }
        });

        expect(table.getBranchHeaders).toHaveBeenCalledWith(projectExtra, 'form-1', 'branch-1');
        expect(table.getRows).toHaveBeenCalledWith('a-project', projectExtra, 'form-1', dataPlain, 'branch-1');
        expect(state.headers).toEqual(['a branch header']);
        expect(state.isBranchTable).toBe(true);
    });

    it('should build the headers and the rows when the entries are loaded', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES + '_FULFILLED',
            payload: { data: dataPlain },
            meta: { projectSlug: 'a-project', formRef: 'form-1', projectExtra }
        });

        expect(table.getHeaders).toHaveBeenCalledWith(projectExtra, 'form-1');
        expect(table.getRows).toHaveBeenCalledWith('a-project', projectExtra, 'form-1', dataPlain);
        expect(state.headers).toEqual(['a header']);
        expect(state.isBranchTable).toBe(false);
    });

    it('should show the loader while a table page is being fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES_TABLE_PAGE + '_PENDING'
        });

        expect(state.isFetchingPage).toBe(true);
    });

    it('should build the headers and the rows when a table page is fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED',
            payload: { data: dataPlain },
            meta: { projectSlug: 'a-project', formRef: 'form-1', projectExtra, currentBranchRef: null }
        });

        expect(table.getHeaders).toHaveBeenCalledWith(projectExtra, 'form-1');
        expect(table.getBranchHeaders).not.toHaveBeenCalled();
        expect(state.isFetchingPage).toBe(false);
    });

    it('should build the branch headers when a table page of a branch is fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED',
            payload: { data: dataPlain },
            meta: { projectSlug: 'a-project', formRef: 'form-1', projectExtra, currentBranchRef: 'branch-1' }
        });

        expect(table.getBranchHeaders).toHaveBeenCalledWith(projectExtra, 'form-1', 'branch-1');
        expect(table.getRows).toHaveBeenCalledWith('a-project', projectExtra, 'form-1', dataPlain, 'branch-1');
        expect(state.headers).toEqual(['a branch header']);
    });

    it('should store the error when a table page could not be fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_ENTRIES_TABLE_PAGE + '_REJECTED',
            payload: { message: 'a message' }
        });

        expect(state.isFetchingPage).toBe(false);
        expect(state.isRejectedPage).toBe(true);
        expect(state.errors).toBe('a message');
    });

    it('should show the loader while the branch entries are being fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_BRANCH_ENTRIES + '_PENDING'
        });

        expect(state.isFetchingPage).toBe(true);
    });

    it('should build the branch headers and the rows when the branch entries are fetched', () => {
        const state = tableReducer(dirtyBulkUploadState, {
            type: FETCH_BRANCH_ENTRIES + '_FULFILLED',
            payload: { data: dataPlain },
            meta: { projectSlug: 'a-project', formRef: 'form-1', branchRef: 'branch-1', projectExtra }
        });

        expect(table.getBranchHeaders).toHaveBeenCalledWith(projectExtra, 'form-1', 'branch-1');
        expect(state.isBranchTable).toBe(true);
        expect(state.filterByFailed).toBe(false);
        expect(state.uploadedRows).toEqual([]);
        expect(state.generatedUuids).toEqual([]);
    });

    it('should show the loader while the child entries are being fetched', () => {
        const state = tableReducer(initialState, {
            type: FETCH_CHILD_ENTRIES + '_PENDING'
        });

        expect(state.isFetchingPage).toBe(true);
        expect(state.isFetchingChildren).toBe(true);
    });

    it('should build the headers and the rows when the child entries are fetched', () => {
        const state = tableReducer(dirtyBulkUploadState, {
            type: FETCH_CHILD_ENTRIES + '_FULFILLED',
            payload: { data: dataPlain },
            meta: { projectSlug: 'a-project', nextFormRef: 'form-2', projectExtra }
        });

        expect(table.getHeaders).toHaveBeenCalledWith(projectExtra, 'form-2');
        expect(state.isFetchingChildren).toBe(false);
        expect(state.isBranchTable).toBe(false);
        expect(state.filterByFailed).toBe(false);
    });

    it('should store the row to delete', () => {
        const state = tableReducer(initialState, {
            type: DELETE_ENTRY + '_PENDING',
            meta: { rowIndexToDelete: 4 }
        });

        expect(state.rowIndexToDelete).toBe(4);
    });

    it('should remove the row and decrement the total when the entry is deleted', () => {
        const state = tableReducer({
            ...initialState,
            rows: [['row-0'], ['row-1'], ['row-2']],
            rowIndexToDelete: 1,
            pagination: { total: 3, newest: 'a date' }
        }, {
            type: DELETE_ENTRY + '_FULFILLED'
        });

        expect(state.rows).toEqual([['row-0'], ['row-2']]);
        expect(state.rowIndexToDelete).toBe(null);
        expect(state.pagination.total).toBe(2);
        expect(state.pagination.newest).toBe('a date');
    });

    it('should clear the row to delete when the entry could not be deleted', () => {
        const state = tableReducer({
            ...initialState,
            rowIndexToDelete: 4
        }, {
            type: DELETE_ENTRY + '_REJECTED'
        });

        expect(state.rowIndexToDelete).toBe(null);
    });

    it('should not be a branch table after the branch navigation is reset', () => {
        const state = tableReducer({
            ...initialState,
            isBranchTable: true
        }, {
            type: RESET_BRANCH_NAVIGATION
        });

        expect(state.isBranchTable).toBe(false);
    });

    it('should not be a branch table after the hierarchy is reset', () => {
        const state = tableReducer({
            ...initialState,
            isBranchTable: true
        }, {
            type: HIERARCHY_NAVIGATE_RESET
        });

        expect(state.isBranchTable).toBe(false);
    });

    it('should set the reverse entries and their mapping', () => {
        const entries = [{ an: 'entry' }];
        const mapping = [{ a: 'mapping' }];

        const state = tableReducer(initialState, {
            type: SET_REVERSE_ENTRIES,
            payload: { entries, mapping }
        });

        expect(state.reverseEntries).toEqual(entries);
        expect(state.reverseMapping).toEqual(mapping);
    });

    it('should set the failed reverse entries and collapse their error rows', () => {
        const entries = [{ an: 'entry' }, { another: 'entry' }];

        const state = tableReducer(initialState, {
            type: SET_REVERSE_FAILED_ENTRIES,
            payload: { entries }
        });

        expect(state.failedReverseEntries).toEqual(entries);
        expect(state.expandedErrorRows).toEqual([false, false]);
    });

    it('should set the uploaded rows', () => {
        const uploadedRows = [{ a: 'row' }];

        const state = tableReducer(initialState, {
            type: SET_UPLOADED_ROWS,
            payload: { uploadedRows }
        });

        expect(state.uploadedRows).toEqual(uploadedRows);
    });

    it('should set the generated uuids', () => {
        const uuids = ['a uuid'];

        const state = tableReducer(initialState, {
            type: SET_GENERATED_UUIDS,
            payload: { uuids }
        });

        expect(state.generatedUuids).toEqual(uuids);
    });

    it('should set the bulk uploadable headers', () => {
        const headers = ['a header'];

        const state = tableReducer(initialState, {
            type: SET_BULK_UPLOADABLE_HEADERS,
            payload: { headers }
        });

        expect(state.bulkUploadableHeaders).toEqual(headers);
    });

    it('should set the expanded error rows', () => {
        const expandedErrorRows = [true, false];

        const state = tableReducer(initialState, {
            type: SET_EXPANDED_ERROR_ROWS,
            payload: { expandedErrorRows }
        });

        expect(state.expandedErrorRows).toEqual(expandedErrorRows);
    });

    it('should set the filter by failed status', () => {
        const state = tableReducer(initialState, {
            type: FILE_UPLOAD_FILTER_BY_FAILED,
            payload: { status: true }
        });

        expect(state.filterByFailed).toBe(true);
    });
});
