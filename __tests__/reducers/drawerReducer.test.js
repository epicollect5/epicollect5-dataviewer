import drawerReducer from 'reducers/drawerReducer';
import PARAMETERS from 'config/parameters';
import {
    TOGGLE_DRAWER_MAP,
    TOGGLE_DRAWER_ENTRY,
    TOGGLE_DRAWER_DOWNLOAD,
    TOGGLE_DRAWER_UPLOAD,
    SET_ACTIVE_MAPPING,
    SET_ACTIVE_TIMEFRAME,
    SET_ACTIVE_FORMAT,
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_ENTRIES_AND_LOCATIONS,
    FETCH_ENTRIES,
    FETCH_BRANCH_ENTRIES,
    FETCH_CHILD_ENTRIES,
    FETCH_ENTRY,
    TOGGLE_ACTIVE_PAGE
} from 'config/actions';

const initialState = {
    showDrawerMap: false,
    showDrawerEntry: false,
    showDrawerDownload: false,
    showDrawerUpload: false,
    content: PARAMETERS.DRAWER_MAP,
    projectStats: {},
    pieChartColors: null,
    activeMapping: null,
    activeTimeframe: PARAMETERS.TIMEFRAME.LIFETIME,
    activeFormat: PARAMETERS.FORMAT_CSV
};

const projectMapping = [
    { name: 'EC5_AUTO', forms: {}, map_index: 0, is_default: false },
    { name: 'a default mapping', forms: {}, map_index: 1, is_default: true }
];

describe('drawer reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = drawerReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = drawerReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    describe('drawers are mutually exclusive', () => {

        it('should open the map drawer and close the others', () => {
            const state = drawerReducer({
                ...initialState,
                showDrawerEntry: true,
                showDrawerDownload: true,
                showDrawerUpload: true
            }, {
                type: TOGGLE_DRAWER_MAP,
                payload: true
            });

            expect(state.showDrawerMap).toBe(true);
            expect(state.showDrawerEntry).toBe(false);
            expect(state.showDrawerDownload).toBe(false);
            expect(state.showDrawerUpload).toBe(false);
        });

        it('should open the entry drawer and close the others', () => {
            const state = drawerReducer({
                ...initialState,
                showDrawerMap: true,
                showDrawerDownload: true,
                showDrawerUpload: true
            }, {
                type: TOGGLE_DRAWER_ENTRY,
                payload: true
            });

            expect(state.showDrawerEntry).toBe(true);
            expect(state.showDrawerMap).toBe(false);
            expect(state.showDrawerDownload).toBe(false);
            expect(state.showDrawerUpload).toBe(false);
        });

        it('should open the download drawer and close the others', () => {
            const state = drawerReducer({
                ...initialState,
                showDrawerMap: true,
                showDrawerEntry: true,
                showDrawerUpload: true
            }, {
                type: TOGGLE_DRAWER_DOWNLOAD,
                payload: true
            });

            expect(state.showDrawerDownload).toBe(true);
            expect(state.showDrawerMap).toBe(false);
            expect(state.showDrawerEntry).toBe(false);
            expect(state.showDrawerUpload).toBe(false);
        });

        it('should open the upload drawer and close the others', () => {
            const state = drawerReducer({
                ...initialState,
                showDrawerMap: true,
                showDrawerEntry: true,
                showDrawerDownload: true
            }, {
                type: TOGGLE_DRAWER_UPLOAD,
                payload: true
            });

            expect(state.showDrawerUpload).toBe(true);
            expect(state.showDrawerMap).toBe(false);
            expect(state.showDrawerEntry).toBe(false);
            expect(state.showDrawerDownload).toBe(false);
        });
    });

    it('should set the active mapping', () => {
        const state = drawerReducer(initialState, {
            type: SET_ACTIVE_MAPPING,
            payload: projectMapping[1]
        });

        expect(state.activeMapping).toEqual(projectMapping[1]);
    });

    it('should set the active timeframe', () => {
        const state = drawerReducer(initialState, {
            type: SET_ACTIVE_TIMEFRAME,
            payload: PARAMETERS.TIMEFRAME.LAST_7_DAYS
        });

        expect(state.activeTimeframe).toBe(PARAMETERS.TIMEFRAME.LAST_7_DAYS);
    });

    it('should set the active format', () => {
        const state = drawerReducer(initialState, {
            type: SET_ACTIVE_FORMAT,
            payload: PARAMETERS.FORMAT_JSON
        });

        expect(state.activeFormat).toBe(PARAMETERS.FORMAT_JSON);
    });

    it('should populate the project stats and the default mapping on project load', () => {
        const projectStats = { form_counts: { 'form-ref-1': 3 } };

        const state = drawerReducer({
            ...initialState,
            showDrawerUpload: true
        }, {
            type: FETCH_PROJECT_AND_ENTRIES + '_FULFILLED',
            payload: {
                meta: {
                    project_mapping: projectMapping,
                    project_stats: projectStats
                }
            }
        });

        expect(state.projectStats).toEqual(projectStats);
        expect(state.projectMapping).toEqual(projectMapping);
        //the default mapping is the one flagged as default
        expect(state.activeMapping).toEqual(projectMapping[1]);
        //the upload drawer is closed after an upload
        expect(state.showDrawerUpload).toBe(false);
    });

    it('should close the upload drawer when the branch entries are fetched', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerUpload: true
        }, {
            type: FETCH_BRANCH_ENTRIES + '_FULFILLED'
        });

        expect(state.showDrawerUpload).toBe(false);
    });

    it('should close the upload drawer when the child entries are fetched', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerUpload: true
        }, {
            type: FETCH_CHILD_ENTRIES + '_FULFILLED'
        });

        expect(state.showDrawerUpload).toBe(false);
    });

    it('should close the drawers when switching form (entries and locations)', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerEntry: true,
            showDrawerMap: true,
            showDrawerDownload: true
        }, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_PENDING'
        });

        expect(state.showDrawerEntry).toBe(false);
        expect(state.showDrawerMap).toBe(false);
        expect(state.showDrawerDownload).toBe(false);
    });

    it('should close the drawers when switching form (entries)', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerEntry: true,
            showDrawerMap: true,
            showDrawerDownload: true
        }, {
            type: FETCH_ENTRIES + '_PENDING'
        });

        expect(state.showDrawerEntry).toBe(false);
        expect(state.showDrawerMap).toBe(false);
        expect(state.showDrawerDownload).toBe(false);
    });

    it('should open the entry drawer as soon as an entry is requested', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerMap: true,
            showDrawerDownload: true
        }, {
            type: FETCH_ENTRY + '_PENDING'
        });

        expect(state.showDrawerEntry).toBe(true);
        expect(state.showDrawerMap).toBe(false);
        expect(state.showDrawerDownload).toBe(false);
    });

    it('should close the entry and map drawers when going back to the table view', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerEntry: true,
            showDrawerMap: true
        }, {
            type: TOGGLE_ACTIVE_PAGE,
            payload: PARAMETERS.PAGE_TABLE
        });

        expect(state.showDrawerEntry).toBe(false);
        expect(state.showDrawerMap).toBe(false);
    });

    it('should keep the drawers when switching to the map view', () => {
        const state = drawerReducer({
            ...initialState,
            showDrawerEntry: true,
            showDrawerMap: true
        }, {
            type: TOGGLE_ACTIVE_PAGE,
            payload: PARAMETERS.PAGE_MAP
        });

        expect(state.showDrawerEntry).toBe(true);
        expect(state.showDrawerMap).toBe(true);
    });
});
