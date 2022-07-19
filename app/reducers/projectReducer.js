import {
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_ENTRIES
} from 'config/actions';

const initialState = {
    projectDefinition: {},
    projectExtra: {},
    projectUser: {},
    projectStats: {},
    projectMapping: [],
    currentFormRef: null,
    parentFormRef: null,
    entriesExtra: [],
    errors: [],
    isFetching: true,
    isFulfilled: false,
    isRejected: false
};

export default function projectReducer(state = initialState, action) {
    switch (action.type) {

        //fetch project first thing
        case FETCH_PROJECT_AND_ENTRIES + '_PENDING':
            //do nothing as we are starting with the loader shown
            return state;
        case FETCH_PROJECT_AND_ENTRIES + '_FULFILLED':
            //put project definition to Store
            return {
                ...state,
                projectDefinition: action.payload.data,
                projectMapping: action.payload.meta.project_mapping,
                projectUser: action.payload.meta.project_user,
                projectStats: action.payload.meta.project_stats,
            };

        case FETCH_PROJECT_AND_ENTRIES + '_REJECTED':
        {
            const response = action.payload.response;
            const errors = response ? action.payload.response.data.errors : action.payload.message;

            return {
                ...state,
                isFetching: false,
                isRejected: true,
                errors
            };
        }
        //fetch entries and entries-locations
        case FETCH_ENTRIES_AND_LOCATIONS + '_PENDING':
        {
            return {
                ...state,
                isFetching: true,
                isRejected: false
            };
        }
        //fetched entries and locations for a form
        case FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED':
        {
            //set entries and entries locations in the Store
            const entriesExtra = action.payload[0].data;
            const projectExtra = action.meta.projectExtra;

            return {
                ...state,
                isFetching: false,
                entriesExtra,
                projectExtra
            };
        }
        //fetched child entries and locations for a form (ONLY when restoring after add/edit entry)
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED':
        {
            //set entries and entries locations in the Store
            const restoredEntriesExtra = action.payload[0].data;
            const restoredProjectExtra = action.meta.projectExtra;

            return {
                ...state,
                isFetching: false,
                entriesExtra: restoredEntriesExtra,
                projectExtra: restoredProjectExtra
            };
        }
        //fetched branch entries and locations for a form (ONLY when restoring after add/edit entry)
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED':
        {
            //set entries and entries locations in the Store
            const restoredEntriesExtra = action.payload[0].data;
            const restoredProjectExtra = action.meta.projectExtra;

            return {
                ...state,
                isFetching: false,
                entriesExtra: restoredEntriesExtra,
                projectExtra: restoredProjectExtra
            };
        }
        //fetched entries only as form has no location inputs
        case FETCH_ENTRIES + '_FULFILLED':
        {
            //set entries and entries locations in the Store
            const entriesExtra = action.payload.data;
            const projectExtra = action.meta.projectExtra;

            return {
                ...state,
                isFetching: false,
                entriesExtra,
                projectExtra
            };
        }
        case FETCH_ENTRIES_AND_LOCATIONS + '_REJECTED':
            return {
                ...state,
                isFetching: false,
                isRejected: true,
                errors: action.payload.response.data.errors
            };
        default:
            return state;
    }
}
