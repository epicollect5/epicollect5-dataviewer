/* Action follows FLUX standard actions specs https://goo.gl/2shf72 */
import axios from 'axios';
import queryString from 'query-string';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';
import { Promise } from 'es6-promise';
import {
    FETCH_ENTRIES,
    FETCH_ENTRY,
    DELETE_ENTRY,
    FETCH_BRANCH_ENTRIES,
    FETCH_CHILD_ENTRIES,
    FETCH_ENTRIES_AND_LOCATIONS,
    RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
    RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
    FETCH_PROJECT_AND_ENTRIES,
    FETCH_ENTRIES_LOCATIONS,
    TOGGLE_DRAWER_MAP,
    TOGGLE_DRAWER_ENTRY,
    TOGGLE_DRAWER_DOWNLOAD,
    SWITCH_FORM,
    FETCH_ENTRIES_TABLE_PAGE,
    FETCH_ENTRIES_LOCATIONS_PAGE,
    TOGGLE_ACTIVE_PAGE,
    FILTER_LOCATIONS_BY_DATES,
    SHOW_DISTRIBUTION_PIE_CHARTS,
    RESET_TIMELINE_FILTER,
    RESET_DISTRIBUTION_FILTER,
    RESET_BRANCH_NAVIGATION,
    HIERARCHY_NAVIGATE_BACK,
    HIERARCHY_NAVIGATE_RESET,
    SET_PIE_CHART_LEGEND,
    SET_ACTIVE_MAPPING,
    SET_ACTIVE_TIMEFRAME,
    SET_ACTIVE_FORMAT,
    TOGGLE_MODAL_DELETE_ENTRY,
    TOGGLE_MODAL_UPLOAD_ENTRIES,
    TOGGLE_MODAL_VIEW_ENTRY,
    TOGGLE_MODAL_PREPARE_DOWNLOAD,
    TOAST_RESET_STATE,
    PROGRESS_BAR_UPDATE,
    MAP_CLOSE_POPUPS,
    MAP_CLOSE_POPUPS_RESET,
    UPDATE_ENTRIES_FILTERS,
    UPDATE_ENTRIES_FILTER_BYTITLE,
    UPDATE_ENTRIES_FILTER_BYDATE,
    UPDATE_ENTRIES_FILTER_ORDERBY,
    RESET_ENTRIES_FILTERS_ON_NAVIGATION,
    PERFORM_ENTRIES_FILTERS_RESET,
    TOGGLE_CLUSTERS,
    TOGGLE_CLUSTERS_OVERLAY,
    TOGGLE_DRAWER_UPLOAD,
    SET_REVERSE_ENTRIES,
    SET_REVERSE_FAILED_ENTRIES,
    SET_UPLOADED_ROWS,
    FILE_UPLOAD_ERROR,
    FILE_DOWNLOAD_ERROR,
    FILE_UPLOAD_FILTER_BY_FAILED,
    SET_EXPANDED_ERROR_ROWS,
    UPLOAD_TABLE_PAGINATION_STATE,
    SET_BULK_UPLOADABLE_HEADERS,
    RESET_FILE_UPLOAD,
    TOGGLE_WAIT_OVERLAY,
    SET_GENERATED_UUIDS
} from 'config/actions';

//need to provide a polyfill for IE11
require('es6-promise').polyfill();

export const resetFileUpload = () => {
    return {
        type: RESET_FILE_UPLOAD,
        payload: null
    };
};

export const toggleWaitOverlay = (show) => {
    return {
        type: TOGGLE_WAIT_OVERLAY,
        payload: { show }
    };
};

export const updateUploadTablePaginationState = (params) => {
    return {
        type: UPLOAD_TABLE_PAGINATION_STATE,
        payload: params
    };
};

export const filterByFailed = (status) => {
    return {
        type: FILE_UPLOAD_FILTER_BY_FAILED,
        payload: { status }
    };
};

export const setReverseEntries = (entries, mapping) => {
    return {
        type: SET_REVERSE_ENTRIES,
        payload: { entries, mapping }
    };
};

export const setFailedReverseEntries = (entries) => {
    return {
        type: SET_REVERSE_FAILED_ENTRIES,
        payload: { entries }
    };
};

export const setGeneratedUuids = (uuids) => {
    return {
        type: SET_GENERATED_UUIDS,
        payload: { uuids }
    };
};

export const setExpandedErrorRows = (expandedErrorRows) => {
    return {
        type: SET_EXPANDED_ERROR_ROWS,
        payload: { expandedErrorRows }
    };
};

export const setUploadedRows = (uploadedRows) => {
    return {
        type: SET_UPLOADED_ROWS,
        payload: { uploadedRows }
    };
};

export const setBulkUploadableHeaders = (headers) => {
    return {
        type: SET_BULK_UPLOADABLE_HEADERS,
        payload: { headers }
    };
};

export const updateEntriesFilterByTitle = (title) => {
    return {
        type: UPDATE_ENTRIES_FILTER_BYTITLE,
        payload: { filterByTitle: title }
    };
};

export const updateEntriesFilterByDate = (startDate, endDate) => {
    return {
        type: UPDATE_ENTRIES_FILTER_BYDATE,
        payload: { startDate, endDate }
    };
};

export const updateEntriesFilterOrderBy = (selectedOrderBy, sortBy, sortOrder) => {
    return {
        type: UPDATE_ENTRIES_FILTER_ORDERBY,
        payload: { selectedOrderBy, sortBy, sortOrder }
    };
};

export const updateEntriesFilters = ({
    sortBy,
    sortOrder,
    filterByTitle,
    startDate,
    endDate
}) => {
    return {
        type: UPDATE_ENTRIES_FILTERS,
        payload: { filterByTitle, startDate, endDate, sortBy, sortOrder }
    };
};

export const resetEntriesFiltersOnNavigation = () => {
    return {
        type: RESET_ENTRIES_FILTERS_ON_NAVIGATION,
        payload: {}
    };
};

export const performEntriesFilterReset = () => {
    return {
        type: PERFORM_ENTRIES_FILTERS_RESET,
        payload: { isPerformingFiltersReset: true }
    };
};

export const mapClosePopups = () => {
    return {
        type: MAP_CLOSE_POPUPS,
        payload: {}
    };
};

export const mapClosePopupsReset = () => {
    return {
        type: MAP_CLOSE_POPUPS_RESET,
        payload: {}
    };
};

export const progressBarUpdate = (progressBarIsVisible,
    progressBarMarkersProcessed,
    progressBarMarkersTotal,
    progressBarPercentage) => {
    return {
        type: PROGRESS_BAR_UPDATE,
        payload: {
            progressBarIsVisible,
            progressBarMarkersProcessed,
            progressBarMarkersTotal,
            progressBarPercentage
        }
    };
};

export const toastResetState = () => {
    return {
        type: TOAST_RESET_STATE,
        payload: {}
    };
};

export const showToastFileUploadError = (message) => {
    return {
        type: FILE_UPLOAD_ERROR,
        payload: { message }
    };
};

export const showToastFileDownloadError = () => {
    return {
        type: FILE_DOWNLOAD_ERROR,
        payload: {}
    };
};

export const toggleModalDeleteEntry = (entryUuid, entryTitle, entryExtra, rowIndex) => {
    return {
        type: TOGGLE_MODAL_DELETE_ENTRY,
        payload: { entryUuid, entryTitle, entryExtra, rowIndex }
    };
};

export const toggleModalUploadEntries = () => {
    return {
        type: TOGGLE_MODAL_UPLOAD_ENTRIES
    };
};

export const toggleModalViewEntry = (headers, answers, entryTitle) => {
    return {
        type: TOGGLE_MODAL_VIEW_ENTRY,
        payload: { headers, answers, entryTitle }
    };
};

export const toggleModalPrepareDownload = (showModal) => {
    return {
        type: TOGGLE_MODAL_PREPARE_DOWNLOAD,
        payload: !showModal
    };
};

export function toggleDrawerMap(showDrawerMap) {
    return {
        type: TOGGLE_DRAWER_MAP,
        payload: !showDrawerMap
    };
}

export function toggleDrawerEntry(showDrawerEntry) {
    return {
        type: TOGGLE_DRAWER_ENTRY,
        payload: !showDrawerEntry
    };
}

export function toggleDrawerDownload(showDrawerDownload) {
    return {
        type: TOGGLE_DRAWER_DOWNLOAD,
        payload: !showDrawerDownload
    };
}

export function toggleDrawerUpload(showDrawerUpload) {
    return {
        type: TOGGLE_DRAWER_UPLOAD,
        payload: !showDrawerUpload
    };
}

export function switchForm(form) {
    return {
        type: SWITCH_FORM,
        payload: form
    };
}

export function toggleActivePage(page) {
    return {
        type: TOGGLE_ACTIVE_PAGE,
        payload: page
    };
}

export function toggleClusters(clustered) {
    return {
        type: TOGGLE_CLUSTERS,
        payload: clustered
    };
}

export function toggleClustersOverlay(state) {
    return {
        type: TOGGLE_CLUSTERS_OVERLAY,
        payload: state
    };
}

export function setActiveMapping(selectedMapping) {
    return {
        type: SET_ACTIVE_MAPPING,
        payload: selectedMapping
    };
}

export function setActiveFormat(selectedFormat) {
    return {
        type: SET_ACTIVE_FORMAT,
        payload: selectedFormat
    };
}

export function setActiveTimeframe(selectedTimeframe) {
    return {
        type: SET_ACTIVE_TIMEFRAME,
        payload: selectedTimeframe
    };
}

export function filterLocationsByDates(startDate, endDate, sliderStartValue, sliderEndValue) {
    return {
        type: FILTER_LOCATIONS_BY_DATES,
        payload: { startDate, endDate, sliderStartValue, sliderEndValue }
    };
}

export const showDistributionPieCharts = ({ selectedDistributionQuestion, pieChartParams }) => {
    return {
        type: SHOW_DISTRIBUTION_PIE_CHARTS,
        payload: { selectedDistributionQuestion, pieChartParams }
    };

};

export const resetTimelineFilter = () => {
    return {
        type: RESET_TIMELINE_FILTER,
        payload: {}
    };
};

export const resetDistributionFilter = () => {
    return {
        type: RESET_DISTRIBUTION_FILTER,
        payload: {}
    };
};

export const setPieChartLegend = (legend) => {
    return {
        type: SET_PIE_CHART_LEGEND,
        payload: { legend }
    };
};

//fetch a single entry
export const fetchEntry = (projectSlug, formRef, entryUuid, branchRef) => {

    const entryQuery = '?' + queryString.stringify({ form_ref: formRef, uuid: entryUuid, branch_ref: branchRef });
    const entryEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_ENDPOINT + projectSlug + entryQuery;
    const entryRequest = axios.get(entryEndpoint);

    return (dispatch) => {
        return dispatch({
            type: FETCH_ENTRY,
            payload: entryRequest
        });
    };
};

export const deleteEntry = (projectSlug, deleteParams, rowIndexToDelete) => {
    const entryEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_DELETION_ENDPOINT + projectSlug;
    const deleteEntryRequest = axios.post(entryEndpoint, deleteParams);


    console.log(deleteEntryRequest);
    console.log(entryEndpoint);
    console.log(JSON.stringify(deleteParams));

    return (dispatch) => {
        return dispatch({
            type: DELETE_ENTRY,
            payload: deleteEntryRequest,
            meta: { rowIndexToDelete }
        }).catch((error) => {
            console.log(error);
        });
    };
};

export const fetchBranchEntries = (projectSlug, formRef, ownerEntryUuid, branchRef, projectExtra, entryTitle, branchBackLink) => {

    const params = {
        form_ref: formRef,
        branch_owner_uuid: ownerEntryUuid,
        branch_ref: branchRef

    };
    const entryQuery = '?' + queryString.stringify(params);
    const entryEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_ENDPOINT + projectSlug + entryQuery;
    const branchEntriesRequest = axios.get(entryEndpoint);

    return (dispatch) => {
        return dispatch({
            type: FETCH_BRANCH_ENTRIES,
            payload: branchEntriesRequest,
            meta: {
                projectSlug,
                formRef,
                branchRef,
                projectExtra,
                ownerEntryUuid,
                entryTitle,
                branchBackLink
            }
        });
    };
};

export const fetchChildEntries = (bundle) => {

    const { formRef, nextFormRef, nextFormName, projectSlug, projectExtra, entryTitle, entryUuid, isActionAfterBulkUpload, entriesFilters } = bundle;

    const params = {
        parent_form_ref: formRef,
        form_ref: nextFormRef,
        parent_uuid: entryUuid
    };

    const entryQuery = '?' + queryString.stringify(params);
    const entryEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_ENDPOINT + projectSlug + entryQuery;
    const childEntriesRequest = axios.get(entryEndpoint);


    console.log('request children endpoint ', entryEndpoint);

    return (dispatch) => {
        return dispatch({
            type: FETCH_CHILD_ENTRIES,
            payload: childEntriesRequest,
            meta: {
                projectSlug,
                parentEntryTitle: entryTitle,
                parentEntryUuid: entryUuid,
                projectExtra,
                nextFormRef,
                nextFormName,
                isActionAfterBulkUpload,
                entriesFilters
            }
        });
    };
};

export const fetchEntriesTablePage = (requestUrl, projectSlug, formRef, projectExtra, filters, currentBranchRef) => {
    console.log(requestUrl);

    const entriesTablePageRequest = axios.get(requestUrl);

    return (dispatch) => {
        return dispatch({
            type: FETCH_ENTRIES_TABLE_PAGE,
            payload: entriesTablePageRequest,
            meta: { projectSlug, formRef, projectExtra, currentBranchRef }
        });
    };
};

export const fetchEntriesLocationsPage = (requestUrl, projectSlug, selectedLocationQuestion) => {
    console.log(requestUrl);
    const entriesLocationsPageRequest = axios.get(requestUrl);

    return (dispatch) => {
        return dispatch({
            type: FETCH_ENTRIES_LOCATIONS_PAGE,
            payload: entriesLocationsPageRequest,
            meta: { projectSlug, selectedLocationQuestion }
        });
    };
};

export const resetBranchNavigation = () => {
    return {
        type: RESET_BRANCH_NAVIGATION,
        payload: {}
    };
};

export const hierarchyNavigateBack = () => {
    return {
        type: HIERARCHY_NAVIGATE_BACK,
        payload: {}
    };
};

export const hierarchyNavigateReset = (previousFormRef) => {
    return {
        type: HIERARCHY_NAVIGATE_RESET,
        payload: { previousFormRef }
    };
};

export const fetchEntriesLocations = ({ selectedLocationQuestion, entriesLocationsEndpoint }) => {

    const entriesLocationsRequest = axios.get(entriesLocationsEndpoint);

    return (dispatch) => {
        return dispatch({
            type: FETCH_ENTRIES_LOCATIONS,
            payload: entriesLocationsRequest,
            meta: { selectedLocationQuestion }
        });
    };
};

//fetch entries and entries locations
export const fetchEntriesAndLocations = (projectSlug, formRef, formName, projectExtra, shouldRestoreParams) => {

    const entriesQuery = '?' + queryString.stringify({ form_ref: formRef });
    const entriesEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_ENDPOINT + projectSlug + entriesQuery;
    const restoreEntriesEndpoint = shouldRestoreParams ? shouldRestoreParams.links.self : null;
    const hierarchyNavigator = shouldRestoreParams ? shouldRestoreParams.hierarchyNavigator : null;
    const isViewingChildren = shouldRestoreParams ? shouldRestoreParams.isViewingChildren : null;
    const isViewingBranch = shouldRestoreParams ? shouldRestoreParams.isViewingBranch : null;
    const entriesFilters = shouldRestoreParams ? shouldRestoreParams.entriesFilters : null;
    const activePage = shouldRestoreParams ? shouldRestoreParams.activePage : null;
    const selectedLocationQuestion = shouldRestoreParams ? shouldRestoreParams.selectedLocationQuestion : null;

    //if we are restoring, check if the first form in the hierarchy navigator has got a location
    //and override the formRef argument to that form ref
    //it is basically the form you are at when starting to navigate the hierarchy
    const locationFormRef = shouldRestoreParams ? shouldRestoreParams.hierarchyNavigator[0].formRef : formRef;
    const hasLocation = projectExtra.forms[locationFormRef].details.has_location;

    //request for entries, restore previous page if an endpoint is set
    const entriesRequest = axios.get(shouldRestoreParams ? restoreEntriesEndpoint : entriesEndpoint);

    //does the form has locations?
    if (hasLocation) {

        let entriesLocationsQuery;

        //are we restoring from a map edit?
        if (selectedLocationQuestion !== null) {
            //we are restoring
            entriesLocationsQuery = '?' + queryString.stringify({
                form_ref: locationFormRef,
                input_ref: selectedLocationQuestion.input_ref,
                branch_ref: selectedLocationQuestion.branch_ref || ''//when null set it to empty string
            });
        } else {
            //get first input ref of location type: it can be a form or a branch location
            const firstLocationInput = projectExtra.forms[locationFormRef].lists.location_inputs[0];
            entriesLocationsQuery = '?' + queryString.stringify({
                form_ref: locationFormRef,
                input_ref: firstLocationInput.input_ref,
                branch_ref: firstLocationInput.branch_ref || ''//when null set it to empty string
            });
        }

        const entriesLocationsEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT + projectSlug + entriesLocationsQuery;
        const entriesAndLocationsRequest = axios.get(entriesLocationsEndpoint);

        //are we restoring to a children view? (check if we are back from branch view)
        if (isViewingChildren && !isViewingBranch) {

            //the selfLink point to the last data set that was requested
            const childEntriesRequest = entriesRequest;
            const childFormRef = shouldRestoreParams.formRef;
            const parentFormRef = shouldRestoreParams.parentFormRef;

            console.log('restore children endpoint ', restoreEntriesEndpoint);

            //get both child entries and entries locations
            return (dispatch) => {
                return dispatch({
                    type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
                    payload: Promise.all([childEntriesRequest, entriesAndLocationsRequest]),
                    meta: {
                        projectSlug,
                        childFormRef,
                        parentFormRef,
                        projectExtra,
                        hierarchyNavigator,
                        entriesFilters
                    }
                });
            };
        }

        //are we restoring to a branch view?
        if (isViewingBranch) {

            const branchEntriesRequest = entriesRequest;
            const branchRef = shouldRestoreParams.branchRef;
            const restoredFormName = shouldRestoreParams.formName;
            const restoredFormRef = shouldRestoreParams.hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
            const branchBackLink = shouldRestoreParams.branchBackLink;
            const entryTitle = shouldRestoreParams.currentBranchOwnerEntryTitle;
            const ownerEntryUuid = shouldRestoreParams.entryUuid;

            console.log('restore branch endpoint ', restoreEntriesEndpoint);
            return (dispatch) => {
                return dispatch({
                    type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
                    payload: Promise.all([branchEntriesRequest, entriesAndLocationsRequest]),
                    meta: {
                        projectSlug,
                        formRef: restoredFormRef,
                        locationFormRef,
                        restoredFormName,
                        branchRef,
                        projectExtra,
                        ownerEntryUuid,
                        entryTitle,
                        branchBackLink,
                        isViewingChildren,
                        hierarchyNavigator,
                        entriesFilters
                    }
                });
            };
        }

        //get both entries and entries locations
        //todo pass restore params here!
        return (dispatch) => {
            return dispatch({
                type: FETCH_ENTRIES_AND_LOCATIONS,
                payload: Promise.all([entriesRequest, entriesAndLocationsRequest]),
                meta: { projectSlug, formRef, formName, projectExtra, entriesFilters, activePage, selectedLocationQuestion }//works => only meta property is allowed to pass extra data https://goo.gl/2shf72
            });
        };
    }


    //FRESH START: just get entries, no locations for this form
    //RESTORE:we might have a parent/owner form to load locations for
    const requests = [];

    //are we restoring to a children view -> parent form might have a location
    //todo what are we doing here?
    if (isViewingChildren && !isViewingBranch) {

        //the selfLink point to the last data set that was requested
        const childEntriesRequest = entriesRequest;
        requests.push(childEntriesRequest);
        const childFormRef = shouldRestoreParams.formRef;
        const parentFormRef = shouldRestoreParams.parentFormRef;

        console.log('restore children endpoint ', restoreEntriesEndpoint);

        //check if the parent form has locations
        const hasParentLocation = projectExtra.forms[parentFormRef].details.has_location;
        console.log('hasParentLocation --------------------------->', hasParentLocation);

        //add request for parent form locations
        if (hasParentLocation) {
            //get first input ref of location type: it can be a form or a branch location
            const parentFirstLocationInput = projectExtra.forms[parentFormRef].lists.location_inputs[0];
            const parentEntriesLocationsQuery = '?' + queryString.stringify({
                form_ref: parentFormRef,
                input_ref: parentFirstLocationInput.input_ref,
                branch_ref: parentFirstLocationInput.branch_ref || ''//when null set it to empty string
            });
            const parentEntriesLocationsEndpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT + projectSlug + parentEntriesLocationsQuery;
            const parentEntriesAndLocationsRequest = axios.get(parentEntriesLocationsEndpoint);
            requests.push(parentEntriesAndLocationsRequest);
        }

        //get both child entries and entries locations
        return (dispatch) => {
            return dispatch({
                type: RESTORE_CHILD_ENTRIES_AND_LOCATIONS,
                payload: Promise.all(requests),
                meta: { projectSlug, childFormRef, parentFormRef, projectExtra, hierarchyNavigator, entriesFilters }
            });
        };
    }

    //are we restoring to a branch view? -> owner form might have a location
    if (isViewingBranch) {
        //the selfLink point to the last data set that was requested
        const branchEntriesRequest = entriesRequest;
        requests.push(branchEntriesRequest);
        const ownerFormRef = shouldRestoreParams.formRef;
        const branchRef = shouldRestoreParams.branchRef;
        const restoredFormName = shouldRestoreParams.formName;
        const branchBackLink = shouldRestoreParams.branchBackLink;
        const entryTitle = shouldRestoreParams.currentBranchOwnerEntryTitle;
        const ownerEntryUuid = shouldRestoreParams.entryUuid;

        return (dispatch) => {
            return dispatch({
                type: RESTORE_BRANCH_ENTRIES_AND_LOCATIONS,
                payload: Promise.all(requests),
                meta: {
                    projectSlug,
                    formRef: ownerFormRef,
                    locationFormRef,
                    restoredFormName,
                    branchRef,
                    projectExtra,
                    ownerEntryUuid,
                    entryTitle,
                    branchBackLink,
                    isViewingChildren,
                    hierarchyNavigator,
                    entriesFilters
                }
            });
        };
    }

    return (dispatch) => {
        return dispatch({
            type: FETCH_ENTRIES,
            payload: entriesRequest,
            meta: { projectSlug, formRef, formName, projectExtra, entriesFilters }
        });
    };

};


//Get Project and entries on first load
export const fetchProjectAndEntries = (projectSlug, shouldRestoreParams) => {

    const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_PROJECT_ENDPOINT + projectSlug;
    const projectRequest = axios.get(endpoint);

    return (dispatch) => {
        return dispatch({
            type: FETCH_PROJECT_AND_ENTRIES,
            payload: new Promise((resolve, reject) => {
                projectRequest.then((response) => {
                    resolve(response.data);
                }).catch((error) => {
                    reject(error);//to trigger the action "reject" in its reducer
                    console.log(error);
                });
            }),
            meta: { shouldRestoreParams }
        }).then(({ value }) => {

            let formRef;
            let formName;
            const projectExtra = value.meta.project_extra;
            const forms = value.data.project.forms;

            if (shouldRestoreParams) {
                //restore from previous state
                formRef = shouldRestoreParams.formRef;
                formName = helpers.getFormName(forms, formRef);
            } else {
                //get top parent form ref
                formRef = value.data.project.forms[0].ref;
                formName = value.data.project.forms[0].name;
            }

            //get entries now using project parameters
            dispatch(fetchEntriesAndLocations(projectSlug, formRef, formName, projectExtra, shouldRestoreParams));
            //clear restore params from localstorage
        }).catch((error) => {
            console.log(error);
        });
    };
};
