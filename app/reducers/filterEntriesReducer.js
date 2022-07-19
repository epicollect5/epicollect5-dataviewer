import {
    FETCH_ENTRIES,
    UPDATE_ENTRIES_FILTERS,
    UPDATE_ENTRIES_FILTER_BYTITLE,
    UPDATE_ENTRIES_FILTER_BYDATE,
    UPDATE_ENTRIES_FILTER_ORDERBY,
    RESET_ENTRIES_FILTERS_ON_NAVIGATION,
    PERFORM_ENTRIES_FILTERS_RESET,
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS
} from 'config/actions';
import PARAMETERS from 'config/parameters';

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

export default function filterEntriesReducer(state = initialState, action) {

    switch (action.type) {

        case UPDATE_ENTRIES_FILTER_BYTITLE: {
            return {
                ...state,
                filterByTitle: action.payload.filterByTitle,
                isUserInteractingWithFilters: true
            };
        }

        case UPDATE_ENTRIES_FILTER_BYDATE: {
            return {
                ...state,
                startDate: action.payload.startDate,
                endDate: action.payload.endDate,
                isUserInteractingWithFilters: true
            };
        }

        case UPDATE_ENTRIES_FILTER_ORDERBY: {
            return {
                ...state,
                selectedOrderBy: action.payload.selectedOrderBy,
                sortBy: action.payload.sortBy,
                sortOrder: action.payload.sortOrder,
                isUserInteractingWithFilters: true
            };
        }

        case UPDATE_ENTRIES_FILTERS: {
            return {
                ...state,
                filterByTitle: action.payload.filterByTitle,
                startDate: action.payload.startDate,
                endDate: action.payload.endDate,
                sortBy: action.payload.sortBy,
                sortOrder: action.payload.sortOrder,
                isPerformingFiltersReset: false,
                isRestoringAfterEdit: false,
                isUserInteractingWithFilters: false
            };
        }

        case PERFORM_ENTRIES_FILTERS_RESET: {
            return {
                ...state,
                isPerformingFiltersReset: true,
                isRestoringAfterEdit: false,
                isUserInteractingWithFilters: false
            };
        }

        case RESET_ENTRIES_FILTERS_ON_NAVIGATION: {
            return {
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
        }

        //when restoring after editing
        case FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            if (action.meta.entriesFilters) {
                return {
                    filterByTitle: action.meta.entriesFilters.filterByTitle,
                    startDate: action.meta.entriesFilters.startDate,
                    endDate: action.meta.entriesFilters.endDate,
                    selectedOrderBy: action.meta.entriesFilters.selectedOrderBy,
                    sortBy: action.meta.entriesFilters.sortBy,
                    sortOrder: action.meta.entriesFilters.sortOrder,
                    isPerformingFiltersReset: false,
                    isRestoringAfterEdit: true,
                    isUserInteractingWithFilters: false
                };
            }
            return { ...state };
        }
        //when restoring after editing
        case FETCH_ENTRIES + '_FULFILLED': {
            if (action.meta.entriesFilters) {
                return {
                    filterByTitle: action.meta.entriesFilters.filterByTitle,
                    startDate: action.meta.entriesFilters.startDate,
                    endDate: action.meta.entriesFilters.endDate,
                    selectedOrderBy: action.meta.entriesFilters.selectedOrderBy,
                    sortBy: action.meta.entriesFilters.sortBy,
                    sortOrder: action.meta.entriesFilters.sortOrder,
                    isPerformingFiltersReset: false,
                    isRestoringAfterEdit: true,
                    isUserInteractingWithFilters: false
                };
            }
            return { ...state };
        }
        //when restoring after editing
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            if (action.meta.entriesFilters) {
                return {
                    filterByTitle: action.meta.entriesFilters.filterByTitle,
                    startDate: action.meta.entriesFilters.startDate,
                    endDate: action.meta.entriesFilters.endDate,
                    selectedOrderBy: action.meta.entriesFilters.selectedOrderBy,
                    sortBy: action.meta.entriesFilters.sortBy,
                    sortOrder: action.meta.entriesFilters.sortOrder,
                    isPerformingFiltersReset: false,
                    isRestoringAfterEdit: true,
                    isUserInteractingWithFilters: false
                };
            }
            return { ...state };
        }
        //when restoring after editing
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            if (action.meta.entriesFilters) {
                return {
                    filterByTitle: action.meta.entriesFilters.filterByTitle,
                    startDate: action.meta.entriesFilters.startDate,
                    endDate: action.meta.entriesFilters.endDate,
                    selectedOrderBy: action.meta.entriesFilters.selectedOrderBy,
                    sortBy: action.meta.entriesFilters.sortBy,
                    sortOrder: action.meta.entriesFilters.sortOrder,
                    isPerformingFiltersReset: false,
                    isRestoringAfterEdit: true,
                    isUserInteractingWithFilters: false
                };
            }
            return { ...state };
        }
        default:
            return state;
    }
}
