jest.mock('axios');

import axios from 'axios';
import * as actions from 'actions';
import * as actionTypes from 'config/actions';
import PARAMETERS from 'config/parameters';
import { getProjectExtra, FORM_REF, SECOND_FORM_REF } from '../fixtures/projectExtra';
import { getRestoreParams } from '../fixtures/restoreParams';

const projectExtra = getProjectExtra();

//name, arguments, expected action
const syncCreatorCases = [
    ['resetFileUpload', [], { type: actionTypes.RESET_FILE_UPLOAD, payload: null }],
    ['toggleWaitOverlay', [true], { type: actionTypes.TOGGLE_WAIT_OVERLAY, payload: { show: true } }],
    ['updateUploadTablePaginationState', [{ pageStart: 0 }], { type: actionTypes.UPLOAD_TABLE_PAGINATION_STATE, payload: { pageStart: 0 } }],
    ['filterByFailed', [true], { type: actionTypes.FILE_UPLOAD_FILTER_BY_FAILED, payload: { status: true } }],
    ['setReverseEntries', [['an entry'], [{ a: 'mapping' }]], { type: actionTypes.SET_REVERSE_ENTRIES, payload: { entries: ['an entry'], mapping: [{ a: 'mapping' }] } }],
    ['setFailedReverseEntries', [['an entry']], { type: actionTypes.SET_REVERSE_FAILED_ENTRIES, payload: { entries: ['an entry'] } }],
    ['setGeneratedUuids', [['a uuid']], { type: actionTypes.SET_GENERATED_UUIDS, payload: { uuids: ['a uuid'] } }],
    ['setExpandedErrorRows', [[true]], { type: actionTypes.SET_EXPANDED_ERROR_ROWS, payload: { expandedErrorRows: [true] } }],
    ['setUploadedRows', [[{ a: 'row' }]], { type: actionTypes.SET_UPLOADED_ROWS, payload: { uploadedRows: [{ a: 'row' }] } }],
    ['setBulkUploadableHeaders', [['a header']], { type: actionTypes.SET_BULK_UPLOADABLE_HEADERS, payload: { headers: ['a header'] } }],
    ['updateEntriesFilterByTitle', ['a title'], { type: actionTypes.UPDATE_ENTRIES_FILTER_BYTITLE, payload: { filterByTitle: 'a title' } }],
    ['updateEntriesFilterByDate', ['2018-01-01', '2018-02-01'], { type: actionTypes.UPDATE_ENTRIES_FILTER_BYDATE, payload: { startDate: '2018-01-01', endDate: '2018-02-01' } }],
    ['updateEntriesFilterOrderBy', ['Newest', 'title', 'ASC'], { type: actionTypes.UPDATE_ENTRIES_FILTER_ORDERBY, payload: { selectedOrderBy: 'Newest', sortBy: 'title', sortOrder: 'ASC' } }],
    ['updateEntriesFilters', [{ sortBy: 'title', sortOrder: 'ASC', filterByTitle: 'a title', startDate: '2018-01-01', endDate: '2018-02-01' }], { type: actionTypes.UPDATE_ENTRIES_FILTERS, payload: { filterByTitle: 'a title', startDate: '2018-01-01', endDate: '2018-02-01', sortBy: 'title', sortOrder: 'ASC' } }],
    ['resetEntriesFiltersOnNavigation', [], { type: actionTypes.RESET_ENTRIES_FILTERS_ON_NAVIGATION, payload: {} }],
    ['performEntriesFilterReset', [], { type: actionTypes.PERFORM_ENTRIES_FILTERS_RESET, payload: { isPerformingFiltersReset: true } }],
    ['mapClosePopups', [], { type: actionTypes.MAP_CLOSE_POPUPS, payload: {} }],
    ['mapClosePopupsReset', [], { type: actionTypes.MAP_CLOSE_POPUPS_RESET, payload: {} }],
    ['progressBarUpdate', [true, 10, 20, 50], { type: actionTypes.PROGRESS_BAR_UPDATE, payload: { progressBarIsVisible: true, progressBarMarkersProcessed: 10, progressBarMarkersTotal: 20, progressBarPercentage: 50 } }],
    ['toastResetState', [], { type: actionTypes.TOAST_RESET_STATE, payload: {} }],
    ['showToastFileUploadError', ['a message'], { type: actionTypes.FILE_UPLOAD_ERROR, payload: { message: 'a message' } }],
    ['showToastFileDownloadError', [], { type: actionTypes.FILE_DOWNLOAD_ERROR, payload: {} }],
    ['toggleModalDeleteEntry', ['an-uuid', 'a title', { some: 'extra' }, 3], { type: actionTypes.TOGGLE_MODAL_DELETE_ENTRY, payload: { entryUuid: 'an-uuid', entryTitle: 'a title', entryExtra: { some: 'extra' }, rowIndex: 3 } }],
    ['toggleModalViewEntry', [['a header'], { an: 'answer' }, 'a title'], { type: actionTypes.TOGGLE_MODAL_VIEW_ENTRY, payload: { headers: ['a header'], answers: { an: 'answer' }, entryTitle: 'a title' } }],
    ['toggleModalPrepareDownload', [true], { type: actionTypes.TOGGLE_MODAL_PREPARE_DOWNLOAD, payload: false }],
    ['toggleDrawerMap', [true], { type: actionTypes.TOGGLE_DRAWER_MAP, payload: false }],
    ['toggleDrawerEntry', [false], { type: actionTypes.TOGGLE_DRAWER_ENTRY, payload: true }],
    ['toggleDrawerDownload', [true], { type: actionTypes.TOGGLE_DRAWER_DOWNLOAD, payload: false }],
    ['toggleDrawerUpload', [true], { type: actionTypes.TOGGLE_DRAWER_UPLOAD, payload: false }],
    ['switchForm', ['a form'], { type: actionTypes.SWITCH_FORM, payload: 'a form' }],
    ['toggleActivePage', ['map'], { type: actionTypes.TOGGLE_ACTIVE_PAGE, payload: 'map' }],
    ['toggleClusters', [true], { type: actionTypes.TOGGLE_CLUSTERS, payload: true }],
    ['toggleClustersOverlay', [false], { type: actionTypes.TOGGLE_CLUSTERS_OVERLAY, payload: false }],
    ['setActiveMapping', [{ name: 'a mapping' }], { type: actionTypes.SET_ACTIVE_MAPPING, payload: { name: 'a mapping' } }],
    ['setActiveFormat', ['json'], { type: actionTypes.SET_ACTIVE_FORMAT, payload: 'json' }],
    ['setActiveTimeframe', ['Today'], { type: actionTypes.SET_ACTIVE_TIMEFRAME, payload: 'Today' }],
    ['filterLocationsByDates', ['2018-01-01', '2018-02-01', 0, 100], { type: actionTypes.FILTER_LOCATIONS_BY_DATES, payload: { startDate: '2018-01-01', endDate: '2018-02-01', sliderStartValue: 0, sliderEndValue: 100 } }],
    ['showDistributionPieCharts', [{ selectedDistributionQuestion: { inputRef: 'a-ref' }, pieChartParams: { possibleAnswersHashMap: {} } }], { type: actionTypes.SHOW_DISTRIBUTION_PIE_CHARTS, payload: { selectedDistributionQuestion: { inputRef: 'a-ref' }, pieChartParams: { possibleAnswersHashMap: {} } } }],
    ['resetTimelineFilter', [], { type: actionTypes.RESET_TIMELINE_FILTER, payload: {} }],
    ['resetDistributionFilter', [], { type: actionTypes.RESET_DISTRIBUTION_FILTER, payload: {} }],
    ['setPieChartLegend', [[{ color: '#ffffff' }]], { type: actionTypes.SET_PIE_CHART_LEGEND, payload: { legend: [{ color: '#ffffff' }] } }]
];

describe('actions test', () => {

    beforeEach(() => {
        axios.get.mockReset();
        axios.post.mockReset();
    });

    describe('sync action creators', () => {

        syncCreatorCases.forEach((testCase) => {
            const name = testCase[0];
            const args = testCase[1];
            const expected = testCase[2];

            it('should create the ' + name + ' action', () => {
                expect(actions[name].apply(null, args)).toEqual(expected);
            });
        });

        it('should create the toggleModalUploadEntries action without a payload', () => {
            const action = actions.toggleModalUploadEntries();

            expect(action.type).toBe(actionTypes.TOGGLE_MODAL_UPLOAD_ENTRIES);
            expect('payload' in action).toBe(false);
        });
    });

    describe('async action creators', () => {

        it('should fetch a single entry', () => {
            const request = Promise.resolve({ data: 'an entry' });
            axios.get.mockReturnValue(request);

            const dispatch = jest.fn();
            actions.fetchEntry('a-project', 'form-1', 'an-uuid', 'branch-1')(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_ENTRY);
            expect(dispatched.payload).toBe(request);
            expect(axios.get.mock.calls[0][0]).toContain('form_ref=form-1');
            expect(axios.get.mock.calls[0][0]).toContain('uuid=an-uuid');
        });

        it('should delete an entry', () => {
            const request = Promise.resolve({ data: 'deleted' });
            axios.post.mockReturnValue(request);

            const dispatch = jest.fn(() => Promise.resolve());
            actions.deleteEntry('a-project', { uuid: 'an-uuid' }, 3)(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.DELETE_ENTRY);
            expect(dispatched.payload).toBe(request);
            expect(dispatched.meta).toEqual({ rowIndexToDelete: 3 });
        });

        it('should fetch the branch entries', () => {
            axios.get.mockReturnValue('a request');

            const dispatch = jest.fn();
            actions.fetchBranchEntries('a-project', 'form-1', 'owner-uuid', 'branch-1', projectExtra, 'Owner title', 'a back link')(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_BRANCH_ENTRIES);
            expect(dispatched.payload).toBe('a request');
            expect(dispatched.meta).toEqual({
                projectSlug: 'a-project',
                formRef: 'form-1',
                branchRef: 'branch-1',
                projectExtra,
                ownerEntryUuid: 'owner-uuid',
                entryTitle: 'Owner title',
                branchBackLink: 'a back link'
            });
        });

        it('should fetch the child entries', () => {
            axios.get.mockReturnValue('a request');

            const bundle = {
                formRef: 'form-1',
                nextFormRef: 'form-2',
                nextFormName: 'Form 2',
                projectSlug: 'a-project',
                projectExtra,
                entryTitle: 'Parent title',
                entryUuid: 'parent-uuid',
                isActionAfterBulkUpload: false,
                entriesFilters: { filterByTitle: 'a title' }
            };

            const dispatch = jest.fn();
            actions.fetchChildEntries(bundle)(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_CHILD_ENTRIES);
            expect(dispatched.payload).toBe('a request');
            expect(dispatched.meta).toEqual({
                projectSlug: 'a-project',
                parentEntryTitle: 'Parent title',
                parentEntryUuid: 'parent-uuid',
                projectExtra,
                nextFormRef: 'form-2',
                nextFormName: 'Form 2',
                isActionAfterBulkUpload: false,
                entriesFilters: { filterByTitle: 'a title' }
            });
        });

        it('should fetch the entries locations', () => {
            axios.get.mockReturnValue('a request');

            const dispatch = jest.fn();
            actions.fetchEntriesLocations({
                selectedLocationQuestion: 'a question',
                entriesLocationsEndpoint: 'a-url'
            })(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_ENTRIES_LOCATIONS);
            expect(dispatched.payload).toBe('a request');
            expect(dispatched.meta).toEqual({ selectedLocationQuestion: 'a question' });
        });

        it('should fetch a page of entries locations', () => {
            axios.get.mockReturnValue('a request');

            const dispatch = jest.fn();
            actions.fetchEntriesLocationsPage('a-url', 'a-project', 'a question')(dispatch);

            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_ENTRIES_LOCATIONS_PAGE);
            expect(dispatched.payload).toBe('a request');
            expect(dispatched.meta).toEqual({ projectSlug: 'a-project', selectedLocationQuestion: 'a question' });
        });
    });

    describe('composite action creators', () => {

        it('should fetch a table page', () => {
            jest.useFakeTimers();
            axios.get.mockReturnValue(Promise.resolve({ data: 'a payload' }));

            const dispatch = jest.fn();
            actions.fetchEntriesTablePage('a-url', 'a-project', 'form-1', projectExtra, null, null)(dispatch);

            //the pending action is dispatched synchronously
            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch.mock.calls[0][0].type).toBe(actionTypes.FETCH_ENTRIES_TABLE_PAGE + '_PENDING');
            expect(dispatch.mock.calls[0][0].meta.projectSlug).toBe('a-project');

            return Promise.resolve().then(() => {
                //the fulfilled action is dispatched after the hardcoded timeout
                jest.runAllTimers();

                expect(dispatch).toHaveBeenCalledTimes(2);
                const fulfilled = dispatch.mock.calls[1][0];
                expect(fulfilled.type).toBe(actionTypes.FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED');
                expect(fulfilled.payload).toEqual({ data: 'a payload' });

                jest.useRealTimers();
            });
        });

        it('should report a rejected table page', () => {
            jest.useRealTimers();
            axios.get.mockReturnValue(Promise.reject(new Error('the request failed')));

            const dispatch = jest.fn();
            actions.fetchEntriesTablePage('a-url', 'a-project', 'form-1', projectExtra, null, null)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);

            //a macrotask lets every pending microtask drain
            return new Promise((resolve) => setTimeout(resolve, 0)).then(() => {
                expect(dispatch).toHaveBeenCalledTimes(2);
                expect(dispatch.mock.calls[1][0].type).toBe(actionTypes.FETCH_ENTRIES_TABLE_PAGE + '_REJECTED');
            });
        });

        it('should fetch the entries and the locations', () => {
            axios.get.mockReturnValue('a request');

            const dispatch = jest.fn();
            actions.fetchEntriesAndLocations('a-project', FORM_REF, 'Form 1', projectExtra, null)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);
            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.FETCH_ENTRIES_AND_LOCATIONS);
            expect(dispatched.meta.formRef).toBe(FORM_REF);
            expect(dispatched.meta.projectExtra).toBe(projectExtra);
        });

        it('should fetch the entries only when the form has no locations', () => {
            axios.get.mockReturnValue('a request');

            const noLocationExtra = getProjectExtra({
                forms: { [FORM_REF]: { details: { has_location: false } } }
            });

            const dispatch = jest.fn();
            actions.fetchEntriesAndLocations('a-project', FORM_REF, 'Form 1', noLocationExtra, null)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch.mock.calls[0][0].type).toBe(actionTypes.FETCH_ENTRIES);
        });

        it('should restore the child entries', () => {
            axios.get.mockReturnValue('a request');

            const restoreParams = getRestoreParams({
                isViewingChildren: true,
                parentFormRef: FORM_REF
            });

            const dispatch = jest.fn();
            actions.fetchEntriesAndLocations('a-project', FORM_REF, 'Form 1', projectExtra, restoreParams)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);
            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.RESTORE_CHILD_ENTRIES_AND_LOCATIONS);
            expect(dispatched.meta.childFormRef).toBe(FORM_REF);
            expect(dispatched.meta.parentFormRef).toBe(FORM_REF);
            expect(dispatched.meta.hierarchyNavigator).toEqual(restoreParams.hierarchyNavigator);
        });

        it('should restore the child entries of a form without locations', () => {
            axios.get.mockReturnValue('a request');

            const restoreParams = getRestoreParams({
                isViewingChildren: true,
                parentFormRef: SECOND_FORM_REF,
                hierarchyNavigator: [{
                    formRef: SECOND_FORM_REF,
                    formName: 'Form 2',
                    selfLink: 'a self link'
                }]
            });

            const dispatch = jest.fn();
            actions.fetchEntriesAndLocations('a-project', SECOND_FORM_REF, 'Form 2', projectExtra, restoreParams)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch.mock.calls[0][0].type).toBe(actionTypes.RESTORE_CHILD_ENTRIES_AND_LOCATIONS);
        });

        it('should restore the branch entries', () => {
            axios.get.mockReturnValue('a request');

            const restoreParams = getRestoreParams({
                isViewingBranch: true,
                branchRef: 'branch-ref-1',
                entryUuid: 'owner-uuid',
                currentBranchOwnerEntryTitle: 'Owner title',
                branchBackLink: 'a back link'
            });

            const dispatch = jest.fn();
            actions.fetchEntriesAndLocations('a-project', FORM_REF, 'Form 1', projectExtra, restoreParams)(dispatch);

            expect(dispatch).toHaveBeenCalledTimes(1);
            const dispatched = dispatch.mock.calls[0][0];
            expect(dispatched.type).toBe(actionTypes.RESTORE_BRANCH_ENTRIES_AND_LOCATIONS);
            expect(dispatched.meta.branchRef).toBe('branch-ref-1');
            expect(dispatched.meta.ownerEntryUuid).toBe('owner-uuid');
            expect(dispatched.meta.entryTitle).toBe('Owner title');
            expect(dispatched.meta.branchBackLink).toBe('a back link');
        });

        it('should fetch the project and then the entries', () => {
            axios.get.mockReturnValue(Promise.resolve({ data: 'a project' }));

            const dispatch = jest.fn(() => Promise.resolve({
                value: {
                    meta: { project_extra: projectExtra },
                    data: { project: { forms: [{ ref: FORM_REF, name: 'Form 1' }] } }
                }
            }));

            return actions.fetchProjectAndEntries('a-project', null)(dispatch).then(() => {
                expect(dispatch).toHaveBeenCalledTimes(2);

                const projectAction = dispatch.mock.calls[0][0];
                expect(projectAction.type).toBe(actionTypes.FETCH_PROJECT_AND_ENTRIES);
                expect(projectAction.meta.shouldRestoreParams).toBe(null);

                //the follow up dispatch is the entries and locations thunk
                const entriesThunk = dispatch.mock.calls[1][0];
                const innerDispatch = jest.fn();
                entriesThunk(innerDispatch);

                expect(innerDispatch.mock.calls[0][0].type).toBe(actionTypes.FETCH_ENTRIES_AND_LOCATIONS);
            });
        });

        it('should restore the project and then the entries', () => {
            axios.get.mockReturnValue(Promise.resolve({ data: 'a project' }));

            const restoreParams = getRestoreParams({ formRef: FORM_REF });
            const dispatch = jest.fn(() => Promise.resolve({
                value: {
                    meta: { project_extra: projectExtra },
                    data: { project: { forms: [{ ref: FORM_REF, name: 'Form 1' }] } }
                }
            }));

            return actions.fetchProjectAndEntries('a-project', restoreParams)(dispatch).then(() => {
                expect(dispatch).toHaveBeenCalledTimes(2);
                expect(dispatch.mock.calls[0][0].meta.shouldRestoreParams).toEqual(restoreParams);
            });
        });
    });
});
