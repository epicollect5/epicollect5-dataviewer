import projectReducer from 'reducers/projectReducer';
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

const projectExtra = { inputs: {}, forms: {} };
const entriesExtra = { data: { entries: [] } };

describe('project reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = projectReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = projectReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should do nothing while the project is loading', () => {
        const state = projectReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_PENDING'
        });
        expect(state).toBe(initialState);
    });

    it('should store the project definition when the project is loaded', () => {
        const projectDefinition = { project: { slug: 'a-project' } };
        const projectMapping = [{ name: 'a mapping' }];
        const projectUser = { id: 1 };
        const projectStats = { form_counts: {} };

        const state = projectReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_FULFILLED',
            payload: {
                data: projectDefinition,
                meta: {
                    project_mapping: projectMapping,
                    project_user: projectUser,
                    project_stats: projectStats
                }
            }
        });

        expect(state.projectDefinition).toEqual(projectDefinition);
        expect(state.projectMapping).toEqual(projectMapping);
        expect(state.projectUser).toEqual(projectUser);
        expect(state.projectStats).toEqual(projectStats);
    });

    it('should store the response errors when the project could not be loaded', () => {
        const state = projectReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_REJECTED',
            payload: {
                response: { data: { errors: ['an error'] } }
            }
        });

        expect(state.isFetching).toBe(false);
        expect(state.isRejected).toBe(true);
        expect(state.errors).toEqual(['an error']);
    });

    it('should fall back to the error message when there is no response', () => {
        const state = projectReducer(initialState, {
            type: FETCH_PROJECT_AND_ENTRIES + '_REJECTED',
            payload: { message: 'a message' }
        });

        expect(state.isFetching).toBe(false);
        expect(state.isRejected).toBe(true);
        expect(state.errors).toBe('a message');
    });

    it('should flag the fetching when the entries are requested', () => {
        const state = projectReducer({
            ...initialState,
            isRejected: true
        }, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_PENDING'
        });

        expect(state.isFetching).toBe(true);
        expect(state.isRejected).toBe(false);
    });

    it('should store the entries and the project extra when the entries are loaded', () => {
        const state = projectReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: entriesExtra }],
            meta: { projectExtra }
        });

        expect(state.isFetching).toBe(false);
        expect(state.entriesExtra).toEqual(entriesExtra);
        expect(state.projectExtra).toEqual(projectExtra);
    });

    it('should store the response errors when the entries could not be loaded', () => {
        const state = projectReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_REJECTED',
            payload: { response: { data: { errors: ['an error'] } } }
        });

        expect(state.isFetching).toBe(false);
        expect(state.isRejected).toBe(true);
        expect(state.errors).toEqual(['an error']);
    });

    it('should restore the entries and the project extra after a child entries edit', () => {
        const state = projectReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: entriesExtra }],
            meta: { projectExtra }
        });

        expect(state.isFetching).toBe(false);
        expect(state.entriesExtra).toEqual(entriesExtra);
        expect(state.projectExtra).toEqual(projectExtra);
    });

    it('should restore the entries and the project extra after a branch entries edit', () => {
        const state = projectReducer(initialState, {
            type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: entriesExtra }],
            meta: { projectExtra }
        });

        expect(state.isFetching).toBe(false);
        expect(state.entriesExtra).toEqual(entriesExtra);
        expect(state.projectExtra).toEqual(projectExtra);
    });

    it('should store the entries and the project extra when the form has no locations', () => {
        const state = projectReducer(initialState, {
            type: FETCH_ENTRIES + '_FULFILLED',
            payload: { data: entriesExtra },
            meta: { projectExtra }
        });

        expect(state.isFetching).toBe(false);
        expect(state.entriesExtra).toEqual(entriesExtra);
        expect(state.projectExtra).toEqual(projectExtra);
    });
});
