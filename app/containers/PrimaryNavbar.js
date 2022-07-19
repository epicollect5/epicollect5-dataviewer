import React from 'react';
import Navbar from 'react-bootstrap/lib/Navbar';
import NavItem from 'react-bootstrap/lib/NavItem';
import Nav from 'react-bootstrap/lib/Nav';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import { connect } from 'react-redux';
import {
    fetchEntriesAndLocations,
    fetchEntriesTablePage,
    toggleActivePage,
    toggleDrawerDownload,
    toggleDrawerUpload,
    hierarchyNavigateReset,
    mapClosePopups,
    performEntriesFilterReset,
    resetDistributionFilter
} from 'actions';
import { bindActionCreators } from 'redux';

import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';

class PrimaryNavbar extends React.Component {

    constructor(props) {
        super(props);

        this.switchForm = this.switchForm.bind(this);
        this.setActivePage = this.setActivePage.bind(this);
        this.handleDownloadClick = this.handleDownloadClick.bind(this);
        this.handleHierachyNavigationExit = this.handleHierachyNavigationExit.bind(this);
        this.handleRedirect = this.handleRedirect.bind(this);
    }

    componentDidMount () {
        console.log('primary navbar mounted');
    }

    //generate the dropdown with the list of forms
    //we get the selected one passing the form ref binding to onSelect()
    getFormsMenuItems (forms) {
        return forms.map((form) => {
            return (
                <MenuItem
                    key={form.ref}
                    eventKey={{ formRef: form.ref, formName: form.name }}
                    onSelect={(event) => {
                        this.switchForm(event);
                    }}
                >
                    {form.name}
                </MenuItem>
            );
        });
    }

    handleDownloadClick () {

        const { projectUser } = this.props;
        if (projectUser.id === null) {
            return false;
        }

        this.props.toggleDrawerDownload(this.props.showDrawerDownload);
    }

    handleHierachyNavigationExit (requestUrl) {
        const { projectSlug, projectExtra, currentFormRef } = this.props;
        this.props.hierarchyNavigateReset(currentFormRef);

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.props.fetchEntriesTablePage(requestUrl, projectSlug, currentFormRef, projectExtra);
    }

    switchForm (form) {

        const { projectDefinition, projectExtra } = this.props;
        const projectSlug = projectDefinition.project.slug;

        this.props.fetchEntriesAndLocations(projectSlug, form.formRef, form.formName, projectExtra);

        //reset distribution when changing location question
        this.props.resetDistributionFilter();
    }

    setActivePage (page) {
        //dispatch action to show map or table

        //when going from map to table, close all popups
        if (page === PARAMETERS.PAGE_TABLE) {
            this.props.mapClosePopups();
        }

        //if we are going from table to map, hide upload drawer
        if (page === PARAMETERS.PAGE_MAP) {
            this.props.toggleDrawerUpload(true);
        }

        this.props.toggleActivePage(page);
    }

    handleRedirect (href) {
        window.location.href = href;
    }

    render () {

        console.log('Rendering primary navbar ------------------------------------------------>');
        const { projectDefinition, currentFormName, isViewingChildren, isFetchingChildren, projectUser } = this.props;
        //show download button only if user is logged in (in production)
        let showDownloadBtn = true;
        let isUserLoggedIn = PARAMETERS.IS_LOCALHOST === 1;//always true when debugging
        const projectName = projectDefinition.project.name;
        const projectSlug = projectDefinition.project.slug;
        const forms = projectDefinition.project.forms;
        const logoUrl = PARAMETERS.SERVER_URL + PARAMETERS.API_MEDIA_ENDPOINT + projectSlug + PARAMETERS.PROJECT_LOGO_QUERY_STRING;
        const projectHomeUrl = PARAMETERS.SERVER_URL + PARAMETERS.PROJECT_HOME_PATH + projectSlug;
        let avatarUrl = PARAMETERS.SERVER_URL + '/images/avatar-placeholder.png';

        //If we are in production, show download button only when user is logged in
        if (PARAMETERS.IS_LOCALHOST === 0) {
            if (projectUser.id === null) {
                showDownloadBtn = false;
            }
        }

        //is the user logged in?
        if (projectUser.role !== null || projectUser.id !== null) {
            //the user must be logged in if either a role is set or a user is is set
            isUserLoggedIn = true;
            avatarUrl = projectUser.avatar;
        }

        //for responsive layout only
        const mobileDropdownFormListTitle = <i className="material-icons">keyboard_arrow_down</i>;

        const siteUrl = window.EC5.SITE_URL;
        const exitHref = PARAMETERS.IS_LOCALHOST ? siteUrl + '/#/' + projectSlug + '/data' : siteUrl + '/project/' + projectSlug;
        const loginHref = PARAMETERS.IS_LOCALHOST ? siteUrl + '/login' : siteUrl + '/login';
        const logoutHref = PARAMETERS.IS_LOCALHOST ? siteUrl + '/login' : siteUrl + '/logout';


        if (isFetchingChildren) {
            return null;
        }

        //return viewChildrenNavbar
        if (isViewingChildren) {

            const { projectExtra, hierarchyNavigator } = this.props;
            const childNavParams = hierarchyNavigator[hierarchyNavigator.length - 1];
            const parentNavParams = hierarchyNavigator[0];//always the top parent form
            const parentBackLink = parentNavParams ? parentNavParams.selfLink : null;
            const parentTitle = childNavParams.parentEntryTitle;
            const childFormRef = childNavParams.formRef;
            const childFormName = projectExtra.forms[childFormRef].details.name;

            return (
                <Navbar fixedTop fluid className="view-children-navbar animated fadeIn">
                    <Navbar.Brand>
                        <a
                            className="view-children-navbar__back-btn"
                            onClick={() => {
                                this.handleHierachyNavigationExit(parentBackLink);
                            }}
                        >
                            <i className="material-icons">arrow_back</i>
                        </a>
                        <span className="view-children-navbar__label">
                            <span className="label__current-form-name">{helpers.textTruncate(currentFormName)} </span>
                            <span className="hidden-xs hidden-sm">entries</span>
                        </span>
                    </Navbar.Brand>

                    <Navbar.Text pullRight>
                        <span className="label__current-child-form-name"> {helpers.textTruncate(childFormName)} </span>

                        <span className="label__current-parent-title hidden-xs hidden-sm"> of "{helpers.textTruncate(parentTitle)}" </span>
                    </Navbar.Text>
                </Navbar>
            );
        }

        return (<Navbar collapseOnSelect fixedTop fluid className="primary-navbar animated fadeIn">
            <Navbar.Header>
                <Navbar.Brand>
                    <a href={projectHomeUrl}>
                        <img
                            className="navbar-project-logo" src={logoUrl} width="40" height="40"
                            alt={projectName}
                        />
                    </a>
                    <span className="navbar-project-name">{helpers.textTruncate(projectName)}</span>
                </Navbar.Brand>
                <NavDropdown
                    id="forms-dropdown"
                    className="forms-dropdown-list hidden-xs"
                    eventKey={0}
                    title={currentFormName}
                >
                    {this.getFormsMenuItems(forms)}
                </NavDropdown>
                <NavDropdown
                    id="forms-dropdown"
                    className="forms-dropdown-list visible-xs"
                    pullRight
                    noCaret
                    eventKey={0}
                    title={mobileDropdownFormListTitle}
                >
                    {this.getFormsMenuItems(forms)}
                </NavDropdown>
                <Navbar.Toggle />
            </Navbar.Header>

            <Navbar.Collapse>
                <Nav pullRight>
                    {!isUserLoggedIn ?
                        <NavItem
                            eventKey={PARAMETERS.LOGIN}
                            onSelect={() => {
                                this.handleRedirect(loginHref);
                            }}
                        >
                            <i className="material-icons">person_outline</i>
                            &nbsp;Login
                        </NavItem>
                        :
                        <Nav className="navbar-username">

                            <Navbar.Text>
                                <img className="avatar" src={avatarUrl} alt="avatar" width={24} />
                                Hi,<strong><span className="name"> {projectUser.name || 'User'}</span></strong>
                            </Navbar.Text>
                            <NavItem
                                eventKey={PARAMETERS.LOGOUT}
                                onSelect={() => {
                                    this.handleRedirect(logoutHref);

                                }}
                            >
                                <i className="material-icons">exit_to_app</i>
                                &nbsp;Logout
                            </NavItem>
                        </Nav>
                    }
                    {showDownloadBtn ?
                        <NavItem
                            eventKey={PARAMETERS.DRAWER_DOWNLOAD}
                            onSelect={(event) => {
                                this.handleDownloadClick(event);
                            }}
                        >
                            <i className="material-icons">file_download</i>
                            &nbsp;Download
                        </NavItem>
                        : null
                    }
                    <NavItem
                        eventKey={PARAMETERS.PAGE_TABLE}
                        onSelect={(event) => {
                            this.setActivePage(event);
                        }}
                    >
                        <i className="material-icons">grid_on</i>
                        &nbsp;Table
                    </NavItem>
                    <NavItem
                        eventKey={PARAMETERS.PAGE_MAP}
                        onSelect={(event) => {
                            this.setActivePage(event);
                        }}
                    >

                        <i className="material-icons">public</i>
                        &nbsp;Map
                    </NavItem>
                    <NavItem
                        eventKey={PARAMETERS.PAGE_HOME}
                        onSelect={() => {
                            this.handleRedirect(exitHref);
                        }}
                    >
                        <i className="material-icons">power_settings_new</i>
                        &nbsp;Exit
                    </NavItem>
                </Nav>
            </Navbar.Collapse>
        </Navbar>
        );
    }
}

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        isFetchingChildren: state.tableReducer.isFetchingChildren,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentFormName: state.navigationReducer.currentFormName,
        isViewingChildren: state.navigationReducer.isViewingChildren,
        projectExtra: state.projectReducer.projectExtra,
        projectDefinition: state.projectReducer.projectDefinition,
        projectUser: state.projectReducer.projectUser,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        showDrawerDownload: state.drawerReducer.showDrawerDownload
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleDrawerDownload,
        toggleDrawerUpload,
        fetchEntriesAndLocations,
        fetchEntriesTablePage,
        toggleActivePage,
        hierarchyNavigateReset,
        mapClosePopups,
        performEntriesFilterReset,
        resetDistributionFilter
    }, dispatch);
};

PrimaryNavbar.propTypes = {
    toggleDrawerDownload: React.PropTypes.func,
    showDrawerDownload: React.PropTypes.bool,
    projectSlug: React.PropTypes.string,
    projectDefinition: React.PropTypes.object,
    projectExtra: React.PropTypes.object,
    projectUser: React.PropTypes.object,
    currentFormRef: React.PropTypes.string,
    currentFormName: React.PropTypes.string,
    hierarchyNavigateReset: React.PropTypes.func,
    performEntriesFilterReset: React.PropTypes.func,
    toggleDrawerUpload: React.PropTypes.func,
    mapClosePopups: React.PropTypes.func,
    toggleActivePage: React.PropTypes.func,
    fetchEntriesTablePage: React.PropTypes.func,
    fetchEntriesAndLocations: React.PropTypes.func,
    hierarchyNavigator: React.PropTypes.array,
    isViewingChildren: React.PropTypes.bool,
    isFetchingChildren: React.PropTypes.bool,
    resetDistributionFilter: React.PropTypes.func
};

export default connect(mapStateToProps, mapDispatchToProps)(PrimaryNavbar);
