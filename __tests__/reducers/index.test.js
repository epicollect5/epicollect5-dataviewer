import { createStore } from 'redux';
import reducers from 'reducers';

const EXPECTED_SLICES = [
    'drawerReducer',
    'filterEntriesReducer',
    'projectReducer',
    'navigationReducer',
    'tableReducer',
    'mapReducer',
    'modalReducer',
    'toastReducer'
];

describe('root reducer test', () => {

    it('should expose exactly the 8 expected slices', () => {
        const store = createStore(reducers);
        expect(Object.keys(store.getState()).sort()).toEqual(EXPECTED_SLICES.slice().sort());
    });

    it('should return the identical state object for an unknown action', () => {
        const store = createStore(reducers);
        const state = store.getState();

        store.dispatch({ type: 'UNKNOWN_ACTION' });

        expect(store.getState()).toBe(state);
    });

    it('should keep the preloaded slices and fall back to the initial state of the others', () => {
        const store = createStore(reducers, {
            drawerReducer: {
                showDrawerMap: true
            }
        });

        const state = store.getState();

        expect(state.drawerReducer).toEqual({ showDrawerMap: true });
        expect(state.toastReducer).toEqual({
            toastSuccessShow: false,
            toastErrorShow: false,
            toastMessage: null
        });
        expect(state.tableReducer.pagination).toBe(null);
        expect(state.tableReducer.rows).toEqual([]);
        expect(state.mapReducer.entriesLocations).toEqual([]);
        expect(state.mapReducer.clustered).toBe(true);
        expect(state.filterEntriesReducer.filterByTitle).toBe('');
        expect(state.filterEntriesReducer.selectedOrderBy).toBe('Newest');
    });
});
