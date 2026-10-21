import filterEntriesReducer from 'reducers/filterEntriesReducer';
import PARAMETERS from 'config/parameters';
import {
    FETCH_ENTRIES,
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    UPDATE_ENTRIES_FILTERS,
    UPDATE_ENTRIES_FILTER_BYTITLE,
    UPDATE_ENTRIES_FILTER_BYDATE,
    UPDATE_ENTRIES_FILTER_ORDERBY,
    RESET_ENTRIES_FILTERS_ON_NAVIGATION,
    PERFORM_ENTRIES_FILTERS_RESET
} from 'config/actions';

const initialState = {
    filterByTitle: '',
    startDate: '',
    endDate: '',
    selectedOrderBy: PARAMETERS.ORDER_BY.NEWEST,
    sortBy: PARAMETERS.DEFAULT_ORDERING_COLUMN,
    sortOrder: PARAMETERS.DEFAULT_ORDERING,
    isPerformingFiltersReset: false,
    isRestoringAfterEdit: false,
    isUserInteractingWithFilters: false
};

const entriesFilters = {
    filterByTitle: 'a title',
    startDate: '2018-01-01',
    endDate: '2018-02-01',
    selectedOrderBy: PARAMETERS.ORDER_BY.OLDEST,
    sortBy: 'title',
    sortOrder: 'ASC'
};

const restoreActionTypes = [
    FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
    FETCH_ENTRIES + '_FULFILLED',
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED'
];

describe('filterEntries reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = filterEntriesReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = filterEntriesReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    describe('restore after edit', () => {

        restoreActionTypes.forEach((actionType) => {

            it('should copy the 6 filter fields and flag the restore on ' + actionType, () => {
                const state = filterEntriesReducer(initialState, {
                    type: actionType,
                    meta: { entriesFilters }
                });

                expect(state.filterByTitle).toBe(entriesFilters.filterByTitle);
                expect(state.startDate).toBe(entriesFilters.startDate);
                expect(state.endDate).toBe(entriesFilters.endDate);
                expect(state.selectedOrderBy).toBe(entriesFilters.selectedOrderBy);
                expect(state.sortBy).toBe(entriesFilters.sortBy);
                expect(state.sortOrder).toBe(entriesFilters.sortOrder);
                expect(state.isRestoringAfterEdit).toBe(true);
                expect(state.isPerformingFiltersReset).toBe(false);
                expect(state.isUserInteractingWithFilters).toBe(false);
            });

            it('should leave the state untouched when there are no entries filters on ' + actionType, () => {
                const state = filterEntriesReducer(initialState, {
                    type: actionType,
                    meta: {}
                });

                //the reducer returns a shallow copy, so compare by value
                expect(state).toEqual(initialState);
                expect(state.isRestoringAfterEdit).toBe(false);
            });
        });
    });

    it('should reset all the filters on navigation', () => {
        const dirtyState = {
            ...initialState,
            filterByTitle: 'a title',
            startDate: '2018-01-01',
            endDate: '2018-02-01',
            selectedOrderBy: PARAMETERS.ORDER_BY.AZ,
            sortBy: 'title',
            sortOrder: 'ASC',
            isPerformingFiltersReset: true,
            isRestoringAfterEdit: true,
            isUserInteractingWithFilters: true
        };

        const state = filterEntriesReducer(dirtyState, {
            type: RESET_ENTRIES_FILTERS_ON_NAVIGATION,
            payload: {}
        });

        expect(state).toEqual(initialState);
    });

    it('should flag the user interaction when filtering by title', () => {
        const state = filterEntriesReducer(initialState, {
            type: UPDATE_ENTRIES_FILTER_BYTITLE,
            payload: { filterByTitle: 'a title' }
        });

        expect(state.filterByTitle).toBe('a title');
        expect(state.isUserInteractingWithFilters).toBe(true);
    });

    it('should flag the user interaction when filtering by date', () => {
        const state = filterEntriesReducer(initialState, {
            type: UPDATE_ENTRIES_FILTER_BYDATE,
            payload: { startDate: '2018-01-01', endDate: '2018-02-01' }
        });

        expect(state.startDate).toBe('2018-01-01');
        expect(state.endDate).toBe('2018-02-01');
        expect(state.isUserInteractingWithFilters).toBe(true);
    });

    it('should flag the user interaction when filtering by order', () => {
        const state = filterEntriesReducer(initialState, {
            type: UPDATE_ENTRIES_FILTER_ORDERBY,
            payload: {
                selectedOrderBy: PARAMETERS.ORDER_BY.ZA,
                sortBy: 'title',
                sortOrder: 'ASC'
            }
        });

        expect(state.selectedOrderBy).toBe(PARAMETERS.ORDER_BY.ZA);
        expect(state.sortBy).toBe('title');
        expect(state.sortOrder).toBe('ASC');
        expect(state.isUserInteractingWithFilters).toBe(true);
    });

    it('should apply all the filters at once and clear every flag', () => {
        const dirtyState = {
            ...initialState,
            isPerformingFiltersReset: true,
            isRestoringAfterEdit: true,
            isUserInteractingWithFilters: true
        };

        const state = filterEntriesReducer(dirtyState, {
            type: UPDATE_ENTRIES_FILTERS,
            payload: {
                filterByTitle: 'a title',
                startDate: '2018-01-01',
                endDate: '2018-02-01',
                sortBy: 'title',
                sortOrder: 'ASC'
            }
        });

        expect(state.filterByTitle).toBe('a title');
        expect(state.startDate).toBe('2018-01-01');
        expect(state.endDate).toBe('2018-02-01');
        expect(state.sortBy).toBe('title');
        expect(state.sortOrder).toBe('ASC');
        expect(state.isPerformingFiltersReset).toBe(false);
        expect(state.isRestoringAfterEdit).toBe(false);
        expect(state.isUserInteractingWithFilters).toBe(false);
    });

    it('should flag the filters reset', () => {
        const dirtyState = {
            ...initialState,
            isRestoringAfterEdit: true,
            isUserInteractingWithFilters: true
        };

        const state = filterEntriesReducer(dirtyState, {
            type: PERFORM_ENTRIES_FILTERS_RESET,
            payload: { isPerformingFiltersReset: true }
        });

        expect(state.isPerformingFiltersReset).toBe(true);
        expect(state.isRestoringAfterEdit).toBe(false);
        expect(state.isUserInteractingWithFilters).toBe(false);
    });
});
