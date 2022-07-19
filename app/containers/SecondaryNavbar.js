import React from 'react';
import Navbar from 'react-bootstrap/lib/Navbar';
import URL from 'url-parse';
import 'url-search-params-polyfill';
import { connect } from 'react-redux';
import {
    performEntriesFilterReset,
    toggleDrawerMap,
    fetchEntriesTablePage,
    fetchEntriesLocationsPage,
    resetBranchNavigation,
    hierarchyNavigateBack
} from 'actions';
import { bindActionCreators } from 'redux';

import DrawerMap from 'containers/DrawerMap';
import DrawerEntry from 'containers/DrawerEntry';
import DrawerDownload from 'containers/DrawerDownload';
import DrawerUpload from 'containers/DrawerUpload';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';
import localstorage from 'utils/localstorage';

class SecondaryNavbar extends React.Component {

    constructor(props) {
        super(props);

        this.handleOnNavbarMenuClick = this.handleOnNavbarMenuClick.bind(this);
        this.handleOnBranchBackClick = this.handleOnBranchBackClick.bind(this);
        this.handleAddChildEntry = this.handleAddChildEntry.bind(this);
        this.handleAddBranchEntry = this.handleAddBranchEntry.bind(this);
    }

    getTableNav() {

        const entriesTotal = this.props.pagination.total;
        const entriesCurrentPage = this.props.pagination.current_page;
        const entriesLastPage = this.props.pagination.last_page;
        const nextPageUrl = this.props.links.next;
        const prevPageUrl = this.props.links.prev;
        const { projectUser, forms, currentFormRef, isViewingChildren, isViewingBranch, hierarchyNavigator } = this.props;
        const { projectExtra, currentBranchRef } = this.props;
        let showAddEntryButton = false;
        let showAddBranchButton = false;
        let formName = '';
        let branchHeader = '';
        let childForm = {};
        let isUserLoggedIn = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging
        const hasQuestions = Object.keys(projectExtra.inputs).length > 0;


        //is the user logged in?
        if (projectUser.role !== null || projectUser.id !== null) {
            //the user must be logged in if either a role is set or a user is is set
            isUserLoggedIn = true;
        }

        //show add entry button when the user is logged in (only for the top parent form)
        if (isUserLoggedIn && (forms[0].ref === currentFormRef && !isViewingBranch)) {

            //if the user is a viewer, do not show any button
            if (projectUser.role !== PARAMETERS.PROJECT_ROLES.VIEWER) {
                showAddEntryButton = true;
                formName = forms[0].name;
            }
        }

        //if we are viewing children, the add button should add a child form entry instead
        if (isViewingChildren) {
            if (isUserLoggedIn && projectUser.role !== PARAMETERS.PROJECT_ROLES.VIEWER) {
                showAddEntryButton = true;
                childForm = hierarchyNavigator[hierarchyNavigator.length - 1];
                formName = childForm.formName;
            }
        }

        //if we are viewing branch entries, the add button should add a branch instead
        if (isViewingBranch) {
            branchHeader = projectExtra.inputs[currentBranchRef].data.question;
            if (isUserLoggedIn && projectUser.role !== PARAMETERS.PROJECT_ROLES.VIEWER) {
                showAddBranchButton = true;
                showAddEntryButton = false;
            }
        }

        //if there no questions for this form yet, hide the addEntry/addBranch button
        if (!hasQuestions) {
            showAddEntryButton = false;
            showAddBranchButton = false;
        }

        return (
            <div className="table-nav-items animated fadeIn pull-right">
                {showAddEntryButton
                    ?
                    <span
                        className="navbar-text navbar-add-entry-btn"
                        onClick={() => {
                            this.handleAddChildEntry();
                        }}
                    >
                        <i className="material-icons">playlist_add</i>
                            <span className="hidden-xs hidden-sm">Add {helpers.textTruncate(formName)}</span>
                    </span>
                    : ''
                }
                {showAddBranchButton
                    ?
                    <span
                        className="navbar-text navbar-add-entry-btn"
                        onClick={() => {
                            this.handleAddBranchEntry();
                        }}
                    >
                        <i className="material-icons">playlist_add</i>
                           <span className="hidden-xs hidden-sm"> Add {helpers.textTruncate(branchHeader)}</span>
                    </span>
                    : ''
                }
                <span className="navbar-text">Total: {entriesTotal}, </span>
                <span className="navbar-text">{entriesCurrentPage}/{entriesLastPage}</span>
                <span className="navbar-text navbar-pagination-btn-wrapper">
                        <button
                            onClick={() => {
                                this.getTablePage(prevPageUrl, false);
                            }}
                            className={prevPageUrl === null ? 'btn disabled navbar-pagination-btn' : 'btn navbar-pagination-btn'}
                            disabled={prevPageUrl === null}
                        >
                            <i className="material-icons">navigate_before</i>
                        </button>
                        <button
                            onClick={() => {
                                this.getTablePage(nextPageUrl, false);
                            }}
                            className={nextPageUrl === null ? 'btn disabled navbar-pagination-btn' : 'btn navbar-pagination-btn'}
                            disabled={nextPageUrl === null}
                        >
                            <i className="material-icons">navigate_next</i>
                        </button>
                    </span>

            </div>
        );
    }

    getMapNav(show, hasEntriesLocations) {

        //if there are not any location return nothing
        if (!hasEntriesLocations) {
            return (
                <div className="map-nav-items animated fadeIn">
                <span className="map-nav-item item-btn">
                        <button
                            className="btn navbar-drawer-btn"
                            onClick={() => {
                                this.handleOnNavbarMenuClick(show);
                            }}
                        >
                            <i className="material-icons">menu</i>
                        </button>
                </span>
                </div>
            );
        }

        const entriesCurrentPage = this.props.mapPagination.current_page;
        const entriesLastPage = this.props.mapPagination.last_page;
        const nextPageUrl = this.props.mapLinks.next;
        const prevPageUrl = this.props.mapLinks.prev;

        const { selectedLocationQuestion, projectStats } = this.props;
        let entriesLocationsTotal = this.props.entriesLocations.length;


        //get total of location entries based on what location questions selected
        if (selectedLocationQuestion.branch_ref === null || selectedLocationQuestion.branch_ref === '') {
            //form input
            //todo do nothing? check this
        } else {
            //branch input
            entriesLocationsTotal = projectStats.branch_counts[selectedLocationQuestion.branch_ref].count;
        }

        //Important: show map pagination controls only when there are more pages (>50000)
        return (
            <div className="map-nav-items animated fadeIn">
                <span className="map-nav-item item-btn">
                        <button
                            className="btn navbar-drawer-btn"
                            onClick={() => {
                                this.handleOnNavbarMenuClick(show);
                            }}
                        >
                            <i className="material-icons">menu</i>
                        </button>
                </span>


                <span className="map-nav-item item-text pull-right total-location-entries">
                    Total: {entriesLocationsTotal}
                </span>

                {entriesLastPage > 1 ?
                    <div className="navbar-pagination-btn-wrapper map-pagination animated fadeIn pull-right">
                        <span className="map-nav-item item-text">{entriesCurrentPage}/{entriesLastPage}</span>
                        <span className="map-nav-item item-btn">
                        <button
                            onClick={() => {
                                this.getMapPage(prevPageUrl, false);
                            }}
                            className={prevPageUrl === null ? 'btn disabled navbar-pagination-btn' : 'btn navbar-pagination-btn'}
                            disabled={prevPageUrl === null}
                        >
                            <i className="material-icons">navigate_before</i>
                        </button>
                        <button
                            onClick={() => {
                                this.getMapPage(nextPageUrl, false);
                            }}
                            className={nextPageUrl === null ? 'btn disabled navbar-pagination-btn' : 'btn navbar-pagination-btn'}
                            disabled={nextPageUrl === null}
                        >
                            <i className="material-icons">navigate_next</i>
                        </button>
                    </span>
                    </div>
                    : null}
            </div>

        );
    }

    //show button with owner entry title and branch header
    getBranchNav() {

        const { projectExtra, currentBranchRef, currentBranchOwnerEntryTitle, branchBackLink } = this.props;
        const branchHeader = projectExtra.inputs[currentBranchRef].data.question;

        //go back to table, same page (self link to use)
        return (
            <div className="branch-nav-items animated fadeIn pull-left">
                <span className="branch-nav-item item-btn">
                        <button
                            className="btn navbar-drawer-btn"
                            onClick={() => {
                                this.handleOnBranchBackClick(branchBackLink);
                            }}
                        >
                            <i className="material-icons">arrow_back</i>
                        </button>
                </span>
                <span className="branch-nav-item item-text">{helpers.textTruncate(currentBranchOwnerEntryTitle)} | <span
                    className="branch-nav-header"
                >{helpers.textTruncate(branchHeader)}
                </span>
                </span>
            </div>
        );
    }

    //get children back button for inner navigation
    getChildrenNav() {

        const { projectExtra, hierarchyNavigator } = this.props;
        const parentNavParams = hierarchyNavigator[hierarchyNavigator.length - 2];
        const parentBackLink = parentNavParams ? parentNavParams.selfLink : null;
        const parentTitle = parentNavParams ? parentNavParams.parentEntryTitle : null;
        const parentFormRef = parentNavParams ? parentNavParams.formRef : null;
        const parentFormName = parentFormRef ? projectExtra.forms[parentFormRef].details.name : null;

        if (hierarchyNavigator.length <= 2) {
            //no parent to go to, this is the top children view
            return null;
        }

        //go back to table, same page (self link to use)
        return (
            <div className="children-nav-items animated fadeIn pull-left">
                <span className="children-nav-item item-btn">
                        <button
                            className="btn navbar-drawer-btn"
                            onClick={() => {
                                this.handleOnParentBackClick(parentBackLink);
                            }}
                        >
                            <i className="material-icons">chevron_left</i>
                        </button>
                </span>
                <span className="children-nav-item item-text">{helpers.textTruncate(parentFormName)} of
                    <span className="children-nav-header"> {helpers.textTruncate(parentTitle)} </span>
                </span>
            </div>
        );
    }

    getTablePage(requestUrl, isNavigationBack) {

        const { projectSlug, projectExtra, hierarchyNavigator, isViewingBranch, isViewingChildren, filters } = this.props;
        let { currentFormRef, currentBranchRef } = this.props;

        if (isNavigationBack) {

            //back from a child or a branch?
            if (isViewingChildren && !isViewingBranch) {
                //back from child view
                currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 2].formRef;
                //pop last item in the hierarchy navigation as we navigate back
                //we do it here after we grab the previous formRef otherwise there would be a race condition between reducers
                //todo super hack add a timeout ha ha ha
                this.props.hierarchyNavigateBack();
            }
            if (isViewingBranch) {
                //back from a branch view
                currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
                //set currentBranchRef to null as we are going back to a main form
                currentBranchRef = null;
            }
        }

        this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra, filters, currentBranchRef);
    }

    getMapPage(requestUrl) {

        const { projectSlug, selectedLocationQuestion } = this.props;

        this.props.fetchEntriesLocationsPage(requestUrl, projectSlug, selectedLocationQuestion);
    }

    handleOnNavbarMenuClick(show) {
        this.props.toggleDrawerMap(show, PARAMETERS.DRAWER_MAP);
    }

    handleOnBranchBackClick(requestUrl) {
        //reset branch navigation, as we go back to main table
        this.props.resetBranchNavigation();

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.getTablePage(requestUrl, true);
    }

    //go back one level up the hierarchy
    handleOnParentBackClick(requestUrl) {
        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.getTablePage(requestUrl, true);
    }

    handleAddChildEntry() {

        const { currentFormRef, currentBranchRef, links, hierarchyNavigator, entriesFilters } = this.props;
        const { isViewingBranch, isViewingChildren } = this.props;
        const selfLink = hierarchyNavigator[hierarchyNavigator.length - 1].selfLink;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const url = new URL(selfLink);
        const activePage = PARAMETERS.PAGE_TABLE;

        const restoreViewParams = {
            formRef,
            parentFormRef: currentFormRef,
            branchRef: currentBranchRef,
            links,
            hierarchyNavigator,
            isViewingBranch,
            isViewingChildren,
            entriesFilters,
            selectedLocationQuestion: null,
            selectedDistributionQuestion: null,
            activePage,
            pieChartParams: null,
            pieChartLegend: null,
            mapControls: {
                sliderStartDate: null,
                sliderEndDate: null,
                sliderStartValue: null,
                sliderEndValue: null
            }
        };

        console.log(PARAMETERS.DATA_EDITOR_BASE_PATH);

        //set params for restoring view when user comes back
        localstorage.save(restoreViewParams);

        //open data editor
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH;
        window.open(dataEditorHref + url.query, '_self');
        console.log('open page -> ', dataEditorHref + url.query);

    }

    handleAddBranchEntry() {
        const { currentFormName, currentBranchRef, hierarchyNavigator, currentBranchOwnerEntryTitle, branchBackLink } = this.props;
        const { isViewingBranch, isViewingChildren } = this.props;
        const { links } = this.props;
        const selfLink = links.self;
        const url = new URL(selfLink);
        const searchParams = new URLSearchParams(url.query);
        const entryUuid = searchParams.get('branch_owner_uuid');
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        let parentFormRef = null;

        if (isViewingChildren) {
            parentFormRef = hierarchyNavigator[hierarchyNavigator.length - 2].formRef;
        }

        const restoreViewParams = {
            formRef,
            parentFormRef,
            branchRef: currentBranchRef,
            formName: currentFormName,
            branchBackLink,
            entryUuid,
            currentBranchOwnerEntryTitle,
            links,
            hierarchyNavigator,
            isViewingBranch,
            isViewingChildren,
            selectedLocationQuestion: null,
            selectedDistributionQuestion: null,
            pieChartParams: null,
            pieChartLegend: null,
            mapControls: {
                sliderStartDate: null,
                sliderEndDate: null,
                sliderStartValue: null,
                sliderEndValue: null
            }
        };

        //set params for restoring view when user comes back
        localstorage.save(restoreViewParams);

        //open data editor
        const dataEditorHref = PARAMETERS.DATA_EDITOR_BASE_PATH + PARAMETERS.DATA_EDITOR_ADD_ENTRY_PATH;
        window.open(dataEditorHref + url.query, '_self');
        console.log('open page -> ', dataEditorHref + url.query);

    }

    render() {
        const { activePage, isViewingBranch, isViewingChildren } = this.props;
        const hasEntriesLocations = this.props.entriesLocations.length > 0;
        const { showDrawerMap, showDrawerEntry, showDrawerDownload } = this.props;

        return (
            <div className="secondary-navbar-wrapper">
                <Navbar fixedTop fluid className="secondary-navbar">

                    {isViewingBranch === true && activePage === PARAMETERS.PAGE_TABLE ? this.getBranchNav() : ''}

                    {isViewingChildren === true && isViewingBranch === false ? this.getChildrenNav() : ''}

                    {activePage === PARAMETERS.PAGE_TABLE
                        ? this.getTableNav(showDrawerMap)
                        : this.getMapNav(showDrawerMap, hasEntriesLocations)}
                </Navbar>
                <DrawerMap show={showDrawerMap} shouldRestoreParams={this.props.shouldRestoreParams} />
                {hasEntriesLocations ? <DrawerEntry show={showDrawerEntry} /> : ''}
                <DrawerDownload show={showDrawerDownload} />
                <DrawerUpload show={showDrawerDownload} />
            </div>
        );
    }
}

SecondaryNavbar.propTypes = {
    shouldRestoreParams: React.PropTypes.func,
    toggleDrawerMap: React.PropTypes.func,
    showDrawerEntry: React.PropTypes.bool,
    showDrawerDownload: React.PropTypes.bool,
    showDrawerMap: React.PropTypes.bool,
    activePage: React.PropTypes.string,
    isViewingBranch: React.PropTypes.bool,
    hierarchyNavigator: React.PropTypes.array,
    isViewingChildren: React.PropTypes.bool,
    pagination: React.PropTypes.object,
    links: React.PropTypes.object,
    mapPagination: React.PropTypes.object,
    mapLinks: React.PropTypes.object,
    projectSlug: React.PropTypes.string,
    projectExtra: React.PropTypes.object,
    entriesLocations: React.PropTypes.array,
    currentFormRef: React.PropTypes.string,
    currentFormName: React.PropTypes.string,
    currentBranchRef: React.PropTypes.string,
    currentBranchOwnerEntryTitle: React.PropTypes.string,
    branchBackLink: React.PropTypes.string,
    projectUser: React.PropTypes.object,
    projectStats: React.PropTypes.object,
    forms: React.PropTypes.array,
    selectedLocationQuestion: React.PropTypes.object,
    filters: React.PropTypes.object,
    fetchEntriesTablePage: React.PropTypes.func,
    fetchEntriesLocationsPage: React.PropTypes.func,
    resetBranchNavigation: React.PropTypes.func,
    performEntriesFilterReset: React.PropTypes.func,
    hierarchyNavigateBack: React.PropTypes.func,
    entriesFilters: React.PropTypes.object
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        showDrawerEntry: state.drawerReducer.showDrawerEntry,
        showDrawerDownload: state.drawerReducer.showDrawerDownload,
        showDrawerMap: state.drawerReducer.showDrawerMap,
        activePage: state.navigationReducer.activePage,
        isViewingBranch: state.navigationReducer.isViewingBranch,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        isViewingChildren: state.navigationReducer.isViewingChildren,
        pagination: state.tableReducer.pagination,
        links: state.tableReducer.links,
        mapPagination: state.mapReducer.pagination,
        mapLinks: state.mapReducer.links,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectExtra: state.projectReducer.projectExtra,
        entriesLocations: state.mapReducer.entriesLocations,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentFormName: state.navigationReducer.currentFormName,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        currentBranchOwnerEntryTitle: state.navigationReducer.currentBranchOwnerEntryTitle,
        branchBackLink: state.navigationReducer.branchBackLink,
        projectUser: state.projectReducer.projectUser,
        projectStats: state.projectReducer.projectStats,
        forms: state.projectReducer.projectDefinition.project.forms,
        selectedLocationQuestion: state.mapReducer.selectedLocationQuestion,
        entriesFilters: state.filterEntriesReducer
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        performEntriesFilterReset,
        toggleDrawerMap,
        fetchEntriesTablePage,
        fetchEntriesLocationsPage,
        resetBranchNavigation,
        hierarchyNavigateBack
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(SecondaryNavbar);
