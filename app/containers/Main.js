import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ToastContainer, ToastMessage } from 'react-toastr';
import { fetchProject, fetchProjectAndEntries, toastResetState } from 'actions';
import axios from 'axios';
import Loader from 'components/Loader';
import ErrorView from 'components/ErrorView';
import PrimaryNavbar from 'containers/PrimaryNavbar';
import SecondaryNavbar from 'containers/SecondaryNavbar';
import TableWrapper from 'components/TableWrapper';
import MapWrapper from 'containers/MapWrapper';
import MapProgressBar from 'containers/MapProgressBar';
import WaitOverlay from 'containers/WaitOverlay';
import ModalDeleteEntry from 'containers/ModalDeleteEntry';
import ModalUploadEntries from 'containers/ModalUploadEntries';
import ModalViewEntry from 'containers/ModalViewEntry';
import ModalPrepareDownload from 'containers/ModalPrepareDownload';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';
import localstorage from 'utils/localstorage';

require('es6-promise').polyfill();

//import EC5 common libraries
//import 'script-loader!libraries/libraries.min.js';
const ToastMessageFactory = React.createFactory(ToastMessage.animation);

class Main extends React.Component {

    constructor(props) {
        super(props);
        this.showToastSuccess = this.showToastSuccess.bind(this);
        this.showToastError = this.showToastError.bind(this);
        this.clearToast = this.clearToast.bind(this);

        //set global request parameters passing the csrf token and content type
        axios.defaults.headers.common['X-XSRF-TOKEN'] = helpers.getXsrfToken();
        axios.defaults.headers.get['Content-Type'] = 'application/vnd.api+json';
    }

    componentDidMount() {

        const href = window.location.href;
        const path = href.replace(window.location.protocol + '//', '');
        const parts = path.split('/');
        const queryString = helpers.getQueryString(href);
        const shouldRestore = helpers.getParameterByName('restore', href);
        const shouldRestoreParams = shouldRestore ? localstorage.getRestoreParams() : null;

        //get the project slug from url, always in the form {path}/{project_slug}/data
        //both in Laravel or standalone mode
        const projectSlug = parts[parts.length - 2];
        let basePath = href.replace('?' + queryString, '');

        basePath = basePath.slice(0, basePath.lastIndexOf('/'));
        //set data editor base path
        PARAMETERS.DATA_EDITOR_BASE_PATH = basePath;
        basePath = basePath.slice(0, basePath.lastIndexOf('/'));
        basePath = basePath.slice(0, basePath.lastIndexOf('/'));

        //set server url if running inside laravel
        if (!PARAMETERS.IS_LOCALHOST) {
            PARAMETERS.SERVER_URL = basePath;
        }
        //get data
        this.props.fetchProjectAndEntries(projectSlug, shouldRestoreParams);

        console.log('main mounted');
    }

    componentDidUpdate() {
        console.log('Main updated ********************************** ->');
        const { toastSuccessShow, toastErrorShow, toastMessage } = this.props;

        //clear any toast if both flags are null
        if (!toastSuccessShow && !toastErrorShow) {
            this.clearToast();
        }

        ////show toast? => done here to avoid setState() warnings
        if (toastSuccessShow) {
            this.showToastSuccess(toastMessage);
            window.setTimeout(() => {
                this.props.toastResetState();
            }, PARAMETERS.TOAST_OPTIONS.SUCCESS.timeOut);
        }
        if (toastErrorShow) {
            this.showToastError(toastMessage);
            window.setTimeout(() => {
                this.props.toastResetState();
            }, PARAMETERS.TOAST_OPTIONS.ERROR.timeOut);
        }
    }

    //clear existing toasts
    clearToast() {
        if (this.toast) {
            this.toast.clear();
        }
    }

    showToastSuccess(message) {
        // Immediately remove current toasts
        this.toast.clear();
        this.toast.success(message, '', PARAMETERS.TOAST_OPTIONS.SUCCESS);

    }

    showToastError(message) {
        // Immediately remove current toasts
        this.toast.clear();
        this.toast.error(message, '', PARAMETERS.TOAST_OPTIONS.ERROR);

    }

    render() {

        //show/hide table/map without re-mounting so we do not destroy the map or the table
        const { activePage, isFetchingProject, isFetchingNavigation, isRejectedProject, projectErrors, isRestoring } = this.props;
        const tableClass = activePage === PARAMETERS.PAGE_TABLE ? '' : 'hidden';
        const mapClass = activePage === PARAMETERS.PAGE_MAP ? '' : 'shifted'; //todo fo not hide map but shift it

        //todo this can be done better, maybe all the fething flags in navigationReducer
        if (isFetchingProject || isFetchingNavigation || isRestoring) {
            return (<Loader />);
        }

        if (isRejectedProject) {
            return (
                <ErrorView errors={projectErrors} />
            );
        }
        //show map and table on the page but hide one or the other based on navigation state
        return (
            <div>
                <ToastContainer
                    toastMessageFactory={ToastMessageFactory}
                    ref={(toast) => {
                        this.toast = toast;
                    }}
                    className="toast-top-full-width"
                />
                <WaitOverlay />
                <div id="main" className="container-fluid">
                    <PrimaryNavbar />
                    <SecondaryNavbar />
                    <TableWrapper class={tableClass} />
                    <MapWrapper class={mapClass} />
                    <ModalDeleteEntry />
                    <ModalViewEntry />
                    <ModalPrepareDownload />
                    <ModalUploadEntries />
                </div>
                <MapProgressBar />
            </div>
        );
    }
}

Main.propTypes = {
    fetchProjectAndEntries: React.PropTypes.func,
    toastSuccessShow: React.PropTypes.bool,
    toastErrorShow: React.PropTypes.bool,
    isFetchingProject: React.PropTypes.bool,
    isFetchingNavigation: React.PropTypes.bool,
    isRejectedProject: React.PropTypes.bool,
    isRestoring: React.PropTypes.bool,
    toastMessage: React.PropTypes.string,
    activePage: React.PropTypes.string,
    toastResetState: React.PropTypes.func,
    projectErrors: React.PropTypes.array
};

//get app state and map to props
function mapStateToProps(state) {
    return {
        isRejectedProject: state.projectReducer.isRejected,
        projectErrors: state.projectReducer.errors,
        isFetchingProject: state.projectReducer.isFetching,
        isFetchingNavigation: state.navigationReducer.isFetching,
        isRestoring: state.navigationReducer.isRestoring,
        activePage: state.navigationReducer.activePage,
        toastSuccessShow: state.toastReducer.toastSuccessShow,
        toastErrorShow: state.toastReducer.toastErrorShow,
        toastMessage: state.toastReducer.toastMessage
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        fetchProject,
        fetchProjectAndEntries,
        toastResetState
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Main);

