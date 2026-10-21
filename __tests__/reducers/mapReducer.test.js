import mapReducer from 'reducers/mapReducer';
import {
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    FETCH_ENTRIES_LOCATIONS_PAGE,
    FILTER_LOCATIONS_BY_DATES,
    FETCH_ENTRIES,
    FETCH_ENTRY,
    FETCH_ENTRIES_LOCATIONS,
    SHOW_DISTRIBUTION_PIE_CHARTS,
    RESET_TIMELINE_FILTER,
    RESET_DISTRIBUTION_FILTER,
    SET_PIE_CHART_LEGEND,
    PROGRESS_BAR_UPDATE,
    MAP_CLOSE_POPUPS,
    TOGGLE_DRAWER_ENTRY,
    MAP_CLOSE_POPUPS_RESET,
    TOGGLE_CLUSTERS,
    TOGGLE_CLUSTERS_OVERLAY
} from 'config/actions';
import { getProjectExtra, FORM_REF } from '../fixtures/projectExtra';

const initialState = {
    isFetchingEntry: false,
    isRejectedEntry: false,
    entriesLocations: [],
    filteredEntries: [],
    pagination: null,
    links: null,
    isFetchingPage: false,
    selectedEntry: null,
    selectedDistributionQuestion: null,
    selectedLocationQuestion: null,
    pieChartParams: null,
    pieChartLegend: null,
    progressBarIsVisible: false,
    progressBarMarkersProcessed: 0,
    progressBarMarkersTotal: 0,
    progressBarPercentage: 0,
    closeAllPopups: false,
    isUserFilteringClustersByDates: false,
    sliderStartDate: null,
    sliderEndDate: null,
    sliderStartValue: null,
    sliderEndValue: null,
    clustered: true,
    overlay: false
};

const features = [
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [9.19, 45.46] },
        properties: { uuid: 'entry-uuid-1', title: 'Entry title 1', created_at: '2018-02-24T17:59:29.179Z' }
    }
];

const locationsPayload = {
    data: {
        data: { geojson: { features } },
        meta: { total: 1 },
        links: { self: 'a self link' }
    }
};

const projectExtra = getProjectExtra();
const locationQuestion = projectExtra.forms[FORM_REF].lists.location_inputs[0];

describe('map reducer test', () => {

    it('should return the initial state for an unknown action', () => {
        const state = mapReducer(undefined, { type: 'UNKNOWN_ACTION' });
        expect(state).toEqual(initialState);
    });

    it('should return the same state object for an unknown action', () => {
        const state = mapReducer(initialState, { type: 'UNKNOWN_ACTION' });
        expect(state).toBe(initialState);
    });

    it('should store the entries locations when the entries and locations are loaded', () => {
        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{}, locationsPayload],
            meta: { formRef: FORM_REF, projectExtra }
        });

        expect(state.entriesLocations).toEqual(features);
        expect(state.selectedLocationQuestion).toEqual(locationQuestion);
        expect(state.pagination).toEqual({ total: 1 });
        expect(state.links).toEqual({ self: 'a self link' });
    });

    it('should use the selected location question when restoring', () => {
        const selectedLocationQuestion = { input_ref: 'location-ref', branch_ref: 'branch-1' };

        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{}, locationsPayload],
            meta: { formRef: FORM_REF, projectExtra, selectedLocationQuestion }
        });

        expect(state.selectedLocationQuestion).toEqual(selectedLocationQuestion);
    });

    it('should restore the child entries locations', () => {
        const hierarchyNavigator = [{ formRef: FORM_REF, formName: 'Form 1' }];

        const state = mapReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: { meta: {}, links: {} } }, locationsPayload],
            meta: { projectExtra, hierarchyNavigator }
        });

        expect(state.entriesLocations).toEqual(features);
        expect(state.selectedLocationQuestion).toEqual(locationQuestion);
    });

    it('should restore the child entries locations when there are no locations', () => {
        const hierarchyNavigator = [{ formRef: FORM_REF, formName: 'Form 1' }];

        const state = mapReducer(initialState, {
            type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: { meta: {}, links: {} } }, null],
            meta: { projectExtra, hierarchyNavigator }
        });

        expect(state.entriesLocations).toEqual([]);
        expect(state.selectedLocationQuestion).toBe(null);
    });

    it('should restore the branch entries locations', () => {
        const state = mapReducer(initialState, {
            type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED',
            payload: [{ data: { meta: {}, links: {} } }, locationsPayload],
            meta: { projectExtra, locationFormRef: FORM_REF }
        });

        expect(state.entriesLocations).toEqual(features);
        expect(state.selectedLocationQuestion).toEqual(locationQuestion);
    });

    it('should clear the entries locations when the form has no location inputs', () => {
        const state = mapReducer({
            ...initialState,
            entriesLocations: features
        }, {
            type: FETCH_ENTRIES + '_FULFILLED',
            payload: { data: {} },
            meta: { formRef: FORM_REF, projectExtra }
        });

        expect(state.entriesLocations).toEqual([]);
    });

    it('should reset the selected entry while it is being fetched', () => {
        const state = mapReducer({
            ...initialState,
            selectedEntry: { some: 'entry' }
        }, {
            type: FETCH_ENTRY + '_PENDING'
        });

        expect(state.selectedEntry).toBe(null);
    });

    it('should store the selected entry when it is fetched', () => {
        const entry = { entry: { entry_uuid: 'entry-uuid-1' } };

        const state = mapReducer(initialState, {
            type: FETCH_ENTRY + '_FULFILLED',
            payload: { data: entry }
        });

        expect(state.selectedEntry).toEqual(entry);
    });

    it('should clear the entries locations while the locations are being fetched', () => {
        const state = mapReducer({
            ...initialState,
            entriesLocations: features
        }, {
            type: FETCH_ENTRIES_LOCATIONS + '_PENDING'
        });

        expect(state.entriesLocations).toEqual([]);
        expect(state.isFetchingPage).toBe(true);
    });

    it('should store the entries locations when they are fetched', () => {
        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_LOCATIONS + '_FULFILLED',
            payload: locationsPayload,
            meta: { selectedLocationQuestion: locationQuestion }
        });

        expect(state.entriesLocations).toEqual(features);
        expect(state.selectedLocationQuestion).toEqual(locationQuestion);
        expect(state.pagination).toEqual({ total: 1 });
        expect(state.links).toEqual({ self: 'a self link' });
        expect(state.isFetchingPage).toBe(false);
    });

    it('should store the error when the locations could not be fetched', () => {
        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_LOCATIONS + '_REJECTED',
            payload: { message: 'a message' }
        });

        expect(state.isFetchingPage).toBe(false);
        expect(state.isRejectedPage).toBe(true);
        expect(state.errors).toBe('a message');
    });

    it('should filter the entries locations by dates', () => {
        const state = mapReducer({
            ...initialState,
            entriesLocations: features
        }, {
            type: FILTER_LOCATIONS_BY_DATES,
            payload: {
                startDate: '2018-01-01',
                endDate: '2018-12-31',
                sliderStartValue: 0,
                sliderEndValue: 100
            }
        });

        expect(state.filteredEntries).toEqual(features);
        expect(state.sliderStartDate).toBe('2018-01-01');
        expect(state.sliderEndDate).toBe('2018-12-31');
        expect(state.sliderStartValue).toBe(0);
        expect(state.sliderEndValue).toBe(100);
        expect(state.isUserFilteringClustersByDates).toBe(true);
    });

    it('should store the distribution question and reset the legend', () => {
        const selectedDistributionQuestion = { inputRef: 'radio-ref' };
        const pieChartParams = { possibleAnswersHashMap: {} };

        const state = mapReducer(initialState, {
            type: SHOW_DISTRIBUTION_PIE_CHARTS,
            payload: { selectedDistributionQuestion, pieChartParams }
        });

        expect(state.selectedDistributionQuestion).toEqual(selectedDistributionQuestion);
        expect(state.pieChartParams).toEqual(pieChartParams);
        expect(state.pieChartLegend).toBe(null);
    });

    it('should keep the legend when the distribution question did not change', () => {
        const selectedDistributionQuestion = { inputRef: 'radio-ref' };
        const legend = [{ color: '#ffffff', answerRef: 'radio-ref-a' }];

        const state = mapReducer({
            ...initialState,
            selectedDistributionQuestion,
            pieChartLegend: legend
        }, {
            type: SHOW_DISTRIBUTION_PIE_CHARTS,
            payload: { selectedDistributionQuestion, pieChartParams: {} }
        });

        expect(state.pieChartLegend).toEqual(legend);
    });

    it('should reset the timeline filter', () => {
        const state = mapReducer({
            ...initialState,
            filteredEntries: features
        }, {
            type: RESET_TIMELINE_FILTER
        });

        expect(state.filteredEntries).toEqual([]);
    });

    it('should reset the distribution filter', () => {
        const state = mapReducer({
            ...initialState,
            selectedDistributionQuestion: { inputRef: 'radio-ref' },
            pieChartParams: { possibleAnswersHashMap: {} },
            pieChartLegend: [{ color: '#ffffff' }]
        }, {
            type: RESET_DISTRIBUTION_FILTER
        });

        expect(state.selectedDistributionQuestion).toBe(null);
        expect(state.pieChartParams).toBe(null);
        expect(state.pieChartLegend).toBe(null);
    });

    it('should set the pie chart legend', () => {
        const legend = [{ color: '#ffffff', answerRef: 'radio-ref-a' }];

        const state = mapReducer(initialState, {
            type: SET_PIE_CHART_LEGEND,
            payload: { legend }
        });

        expect(state.pieChartLegend).toEqual(legend);
    });

    it('should update the progress bar', () => {
        const state = mapReducer(initialState, {
            type: PROGRESS_BAR_UPDATE,
            payload: {
                progressBarIsVisible: true,
                progressBarMarkersProcessed: 10,
                progressBarMarkersTotal: 20,
                progressBarPercentage: 50
            }
        });

        expect(state.progressBarIsVisible).toBe(true);
        expect(state.progressBarMarkersProcessed).toBe(10);
        expect(state.progressBarMarkersTotal).toBe(20);
        expect(state.progressBarPercentage).toBe(50);
    });

    it('should close all the popups', () => {
        const state = mapReducer(initialState, {
            type: MAP_CLOSE_POPUPS
        });

        expect(state.closeAllPopups).toBe(true);
    });

    it('should reset the popups', () => {
        const state = mapReducer({
            ...initialState,
            closeAllPopups: true
        }, {
            type: MAP_CLOSE_POPUPS_RESET
        });

        expect(state.closeAllPopups).toBe(false);
    });

    it('should reopen the popups when the entry drawer is opened', () => {
        const state = mapReducer({
            ...initialState,
            closeAllPopups: true
        }, {
            type: TOGGLE_DRAWER_ENTRY,
            payload: true
        });

        expect(state.closeAllPopups).toBe(false);
    });

    it('should keep the popups closed when the entry drawer is closed', () => {
        const state = mapReducer({
            ...initialState,
            closeAllPopups: true
        }, {
            type: TOGGLE_DRAWER_ENTRY,
            payload: false
        });

        expect(state.closeAllPopups).toBe(true);
    });

    it('should toggle the clusters', () => {
        const state = mapReducer(initialState, {
            type: TOGGLE_CLUSTERS,
            payload: true
        });

        expect(state.clustered).toBe(false);
    });

    it('should toggle the clusters overlay', () => {
        const state = mapReducer(initialState, {
            type: TOGGLE_CLUSTERS_OVERLAY,
            payload: true
        });

        expect(state.overlay).toBe(true);
    });

    it('should clear the entries locations while a page is being fetched', () => {
        const state = mapReducer({
            ...initialState,
            entriesLocations: features
        }, {
            type: FETCH_ENTRIES_LOCATIONS_PAGE + '_PENDING'
        });

        expect(state.entriesLocations).toEqual([]);
        expect(state.isFetchingPage).toBe(true);
    });

    it('should store the entries locations when a page is fetched', () => {
        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_LOCATIONS_PAGE + '_FULFILLED',
            payload: locationsPayload,
            meta: { selectedLocationQuestion: locationQuestion }
        });

        expect(state.entriesLocations).toEqual(features);
        expect(state.selectedLocationQuestion).toEqual(locationQuestion);
        expect(state.pagination).toEqual({ total: 1 });
        expect(state.links).toEqual({ self: 'a self link' });
        expect(state.isFetchingPage).toBe(false);
    });

    it('should store the error when a page could not be fetched', () => {
        const state = mapReducer(initialState, {
            type: FETCH_ENTRIES_LOCATIONS_PAGE + '_REJECTED',
            payload: { message: 'a message' }
        });

        expect(state.isFetchingPage).toBe(false);
        expect(state.isRejectedPage).toBe(true);
        expect(state.errors).toBe('a message');
    });
});
