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
import mapUtils from 'utils/mapUtils';

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

export default function mapReducer(state = initialState, action) {

    switch (action.type) {

        //action triggered on first page load
        case FETCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {

            const projectExtra = action.meta.projectExtra;
            const formRef = action.meta.formRef;
            let selectedLocationQuestion;

            //are we restoring?
            if (action.meta.selectedLocationQuestion) {
                selectedLocationQuestion = action.meta.selectedLocationQuestion;
            } else {
                selectedLocationQuestion = projectExtra.forms[formRef].lists.location_inputs[0];
            }


            //put entries locations into Store
            return {
                ...state,
                entriesLocations: action.payload[1].data.data.geojson.features,
                selectedLocationQuestion,
                pagination: action.payload[1].data.meta,
                links: action.payload[1].data.links
            };
        }
        //triggered when restoring after add/edit entry
        case RESTORE_CHILD_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            const restoredChildProjectExtra = action.meta.projectExtra;

            //we need to restore the map for the FIRST form in the hierarchy (where we started navigating children) IF IT EXIST
            const restoredChildFormRef = action.meta.hierarchyNavigator[0].formRef;//as we are restoring the PARENT form locations/map

            const restoredChildEntriesLocations = action.payload[1] ? action.payload[1].data.data.geojson.features : [];
            const restoredFormSelectedLocationQuestion = action.payload[1] ? restoredChildProjectExtra.forms[restoredChildFormRef].lists.location_inputs[0] : null;

            return {
                ...state,
                entriesLocations: restoredChildEntriesLocations,
                selectedLocationQuestion: restoredFormSelectedLocationQuestion,
                pagination: action.payload[0].data.meta,
                links: action.payload[0].data.links
            };
        }
        //triggered when restoring after add/edit entry
        case RESTORE_BRANCH_ENTRIES_AND_LOCATIONS + '_FULFILLED': {
            const restoredBranchProjectExtra = action.meta.projectExtra;
            const restoredLocationFormRef = action.meta.locationFormRef;

            const restoredBranchEntriesLocations = action.payload[1] ? action.payload[1].data.data.geojson.features : [];
            const restoredBranchSelectedLocationQuestion = action.payload[1] ? restoredBranchProjectExtra.forms[restoredLocationFormRef].lists.location_inputs[0] : null;

            return {
                ...state,
                entriesLocations: restoredBranchEntriesLocations,
                selectedLocationQuestion: restoredBranchSelectedLocationQuestion,
                pagination: action.payload[0].data.meta,
                links: action.payload[0].data.links
            };
        }
        //action triggered when requesting data for a form but there are no location entries
        //need to clear the map
        case FETCH_ENTRIES + '_FULFILLED': {
            return {
                ...state,
                entriesLocations: []
            };
        }
        //reset selectedEntry to null to show loader in drawer when fetching new entry
        case FETCH_ENTRY + '_PENDING':
            return {
                ...state,
                selectedEntry: null
            };
        //got the entry when clicking on a marker
        case FETCH_ENTRY + '_FULFILLED': {
            return {
                ...state,
                selectedEntry: action.payload.data
            };
        }

        //remove any entries locations currently on the map
        case FETCH_ENTRIES_LOCATIONS + '_PENDING':
            //show loader instead of table
            return {
                ...state,
                entriesLocations: [],
                isFetchingPage: true
            };
        //fetch entries locations
        case FETCH_ENTRIES_LOCATIONS + '_FULFILLED': {

            return {
                ...state,
                entriesLocations: action.payload.data.data.geojson.features,
                selectedLocationQuestion: action.meta.selectedLocationQuestion,
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isFetchingPage: false
            };
        }
        case FETCH_ENTRIES_LOCATIONS + '_REJECTED':
            //show loader instead of table
            return {
                ...state,
                isFetchingPage: false,
                isRejectedPage: true,
                errors: action.payload.message

            };
        case FILTER_LOCATIONS_BY_DATES: {

            //filter data set by data range
            const filteredEntries = mapUtils.getFilteredEntries(state.entriesLocations, action.payload.startDate, action.payload.endDate);


            return {
                ...state,
                filteredEntries,
                sliderStartDate: action.payload.startDate,
                sliderEndDate: action.payload.endDate,
                sliderStartValue: action.payload.sliderStartValue,
                sliderEndValue: action.payload.sliderEndValue,
                isUserFilteringClustersByDates: true
            };
        }
        case SHOW_DISTRIBUTION_PIE_CHARTS: {
            if (state.selectedDistributionQuestion !== null) {
                //reset legend only if the distribution question changed
                if (state.selectedDistributionQuestion.inputRef === action.payload.selectedDistributionQuestion.inputRef) {
                    return {
                        ...state,
                        selectedDistributionQuestion: action.payload.selectedDistributionQuestion,
                        pieChartParams: action.payload.pieChartParams
                    };
                }
            }

            return {
                ...state,
                selectedDistributionQuestion: action.payload.selectedDistributionQuestion,
                pieChartParams: action.payload.pieChartParams,
                pieChartLegend: null//reset legend each time
            };
        }
        case RESET_TIMELINE_FILTER:
            return {
                ...state,
                filteredEntries: []
            };
        case RESET_DISTRIBUTION_FILTER:
            return {
                ...state,
                selectedDistributionQuestion: null,
                pieChartParams: null,
                pieChartLegend: null
            };
        case SET_PIE_CHART_LEGEND:
            return {
                ...state,
                pieChartLegend: action.payload.legend
            };
        case PROGRESS_BAR_UPDATE: {
            return {
                ...state,
                progressBarIsVisible: action.payload.progressBarIsVisible,
                progressBarMarkersProcessed: action.payload.progressBarMarkersProcessed,
                progressBarMarkersTotal: action.payload.progressBarMarkersTotal,
                progressBarPercentage: action.payload.progressBarPercentage
            };
        }
        case MAP_CLOSE_POPUPS: {
            return {
                ...state,
                closeAllPopups: true
            };
        }
        case MAP_CLOSE_POPUPS_RESET: {
            return {
                ...state,
                closeAllPopups: false
            };
        }
        case TOGGLE_DRAWER_ENTRY: {
            const showDrawerEntry = action.payload;

            if (showDrawerEntry) {
                return {
                    ...state,
                    closeAllPopups: false
                };
            }
            return {
                ...state
            };
        }
        //toggle cluster on or off
        case TOGGLE_CLUSTERS: {
            const clustered = action.payload;
                return {
                    ...state,
                    clustered: !clustered
                };
        }
        //toggle cluster on or off
        case TOGGLE_CLUSTERS_OVERLAY: {
            return {
                ...state,
                overlay: action.payload
            };
        }
        //fetch project first thing
        case FETCH_ENTRIES_LOCATIONS_PAGE + '_PENDING':
            //show loader instead of table
            return {
                ...state,
                entriesLocations: [],
                //selectedLocationQuestion: null,//todo check this again with the latest changes
                isFetchingPage: true
            };
        case FETCH_ENTRIES_LOCATIONS_PAGE + '_FULFILLED': {
            const selectedLocationQuestion = action.meta.selectedLocationQuestion;

            return {
                ...state,
                entriesLocations: action.payload.data.data.geojson.features,
                selectedLocationQuestion,
                pagination: action.payload.data.meta,
                links: action.payload.data.links,
                isFetchingPage: false
            };
        }
        case FETCH_ENTRIES_LOCATIONS_PAGE + '_REJECTED':
            return {
                ...state,
                isFetchingPage: false,
                isRejectedPage: true,
                errors: action.payload.message
            };
        default:
            return state;
    }
}
