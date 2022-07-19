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
import helpers from 'utils/helpers';
import PARAMETERS from 'config/parameters';


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

export default function drawerReducer(state = initialState, action) {

    switch (action.type) {
        case TOGGLE_DRAWER_MAP:
            return {
                ...state,
                showDrawerMap: action.payload,
                showDrawerEntry: false,
                showDrawerDownload: false,
                showDrawerUpload: false
            };
        case TOGGLE_DRAWER_ENTRY:
            return {
                ...state,
                showDrawerMap: false,
                showDrawerEntry: action.payload,
                showDrawerDownload: false,
                showDrawerUpload: false
            };
        case TOGGLE_DRAWER_DOWNLOAD:
            return {
                ...state,
                showDrawerDownload: action.payload,
                showDrawerEntry: false,
                showDrawerMap: false,
                showDrawerUpload: false
            };
        case TOGGLE_DRAWER_UPLOAD:
            return {
                ...state,
                showDrawerMap: false,
                showDrawerEntry: false,
                showDrawerDownload: false,
                showDrawerUpload: action.payload
            };
        case SET_ACTIVE_MAPPING:
            return {
                ...state,
                activeMapping: action.payload
            };
        case SET_ACTIVE_TIMEFRAME:
            return {
                ...state,
                activeTimeframe: action.payload
            };
        case SET_ACTIVE_FORMAT:
            return {
                ...state,
                activeFormat: action.payload
            };
        case FETCH_PROJECT_AND_ENTRIES + '_FULFILLED': {
            const projectMapping = action.payload.meta.project_mapping;
            //set activeMapping to default mapping
            const activeMapping = helpers.getDefaultMapping(projectMapping);
            const projectStats = action.payload.meta.project_stats;

            return {
                ...state,
                projectStats,
                projectMapping,
                activeMapping,
                showDrawerUpload: false //close upload drawer after upload

            };
        }

        //close upload drawer after upload
        case FETCH_BRANCH_ENTRIES + '_FULFILLED': {
            return {
                ...state,
                showDrawerUpload: false
            };
        }
        //close upload drawer after upload
        case FETCH_CHILD_ENTRIES + '_FULFILLED': {
            return {
                ...state,
                showDrawerUpload: false
            };
        }

        //close all drawers when switching forms
        case FETCH_ENTRIES_AND_LOCATIONS + '_PENDING': {
            return {
                ...state,
                showDrawerEntry: false,
                showDrawerMap: false,
                showDrawerDownload: false
            };
        }
        //close all drawers when switching forms
        case FETCH_ENTRIES + '_PENDING': {
            return {
                ...state,
                showDrawerEntry: false,
                showDrawerMap: false,
                showDrawerDownload: false
            };
        }
        //show entry drawer entry as soon as we start requesting an entry, close all the others
        case FETCH_ENTRY + '_PENDING':
            return {
                ...state,
                showDrawerEntry: true,
                showDrawerMap: false,
                showDrawerDownload: false
            };
        //close any map drawer when we go back to table view
        case TOGGLE_ACTIVE_PAGE:
            if (action.payload === PARAMETERS.PAGE_TABLE) {
                return {
                    ...state,
                    showDrawerEntry: false,
                    showDrawerMap: false
                };
            }
            return {
                ...state
            };
        default:
            return state;
    }
}
