import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import { bindActionCreators } from 'redux';
import {
    toggleModalUploadEntries,
    setFailedReverseEntries,
    fetchProjectAndEntries,
    updateUploadTablePaginationState,
    toggleWaitOverlay,
    performEntriesFilterReset,
    fetchChildEntries,
    fetchBranchEntries
} from 'actions';
import { connect } from 'react-redux';
import requests from 'utils/requests';
import TableUploadWrapper from 'components/TableUploadWrapper';
import Loader from 'components/Loader';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';

class ModalUploadEntries extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            responses: [],
            failedResponses: []
        };

        this.isFirstRun = true;
        this.failedReverseEntries = [];
        this.clonedReverseEntries = [];
        this.wasInterruptedUpload = false;

        this.close = this.close.bind(this);
        this.handleClickNext = this.handleClickNext.bind(this);
        this.handleClickPrev = this.handleClickPrev.bind(this);
        this.getBranchEntries = this.getBranchEntries.bind(this);
        this.getChildEntries = this.getChildEntries.bind(this);
    }

    //handle click on pagination next button
    handleClickNext () {
        const { responses, failedResponses } = this.state;
        const { filterByFailed } = this.props;

        const dataArray = filterByFailed ? failedResponses : responses;
        const { uploadTablePageStart, uploadTablePageEnd } = this.props;
        const perPage = PARAMETERS.TABLE_UPLOAD_PER_PAGE;

        if (((uploadTablePageEnd * perPage) + 1) > (dataArray.length / 2)) {
            return false;
        }

        //show overlay
        this.props.toggleWaitOverlay(true);

        //did we reach the last page?
        if ((uploadTablePageEnd + 1) * perPage >= (dataArray.length / 2)) {
            this.props.updateUploadTablePaginationState({
                pageStart: uploadTablePageStart + 1,
                pageEnd: uploadTablePageEnd + 1,
                nextBtnEnabled: false,
                prevBtnEnabled: true
            });
        } else {
            this.props.updateUploadTablePaginationState({
                pageStart: uploadTablePageStart + 1,
                pageEnd: uploadTablePageEnd + 1,
                nextBtnEnabled: true,
                prevBtnEnabled: true
            });
        }

        //hack...hide the overlay after a delay
        window.setTimeout(() => {
            this.props.toggleWaitOverlay(false);
        }, 2 * PARAMETERS.DELAY.LONG);
    }

    handleClickPrev () {
        const { uploadTablePageStart, uploadTablePageEnd } = this.props;

        if ((uploadTablePageStart - 1) < 0) {
            return false;
        }

        //show overlay
        this.props.toggleWaitOverlay(true);

        //did we reach the first page?
        if ((uploadTablePageStart - 1) === 0) {
            this.props.updateUploadTablePaginationState({
                pageStart: 0,
                pageEnd: 1,
                prevBtnEnabled: false,
                nextBtnEnabled: true
            });
        } else {
            this.props.updateUploadTablePaginationState({
                pageStart: uploadTablePageStart - 1,
                pageEnd: uploadTablePageEnd - 1,
                prevBtnEnabled: true,
                nextBtnEnabled: true
            });
        }

        //hack...hide the overlay after a delay
        window.setTimeout(() => {
            this.props.toggleWaitOverlay(false);
        }, 2 * PARAMETERS.DELAY.LONG);
    }

    getBranchEntries () {

        const { hierarchyNavigator, projectSlug, projectExtra, currentBranchRef, currentBranchOwnerUuid, branchBackLink, currentBranchOwnerEntryTitle } = this.props;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.props.fetchBranchEntries(
            projectSlug,
            formRef,
            currentBranchOwnerUuid,
            currentBranchRef,
            projectExtra,
            currentBranchOwnerEntryTitle,
            branchBackLink
        );
    }

    getChildEntries () {

        const { forms, projectSlug, projectExtra } = this.props;
        const hierarchyNavigator = this.props.hierarchyNavigator;
        const formRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const entryUuid = hierarchyNavigator[hierarchyNavigator.length - 1].parentEntryUuid;
        const entryTitle = hierarchyNavigator[hierarchyNavigator.length - 1].parentEntryTitle;
        const prevForm = helpers.getPrevForm(forms, formRef);
        const nextForm = helpers.getNextForm(forms, prevForm.ref);

        const bundle = {
            projectSlug,
            formRef: prevForm.ref,
            nextFormRef: nextForm.ref,
            nextFormName: nextForm.name,
            entryUuid,
            entryTitle,
            projectExtra,
            isActionAfterBulkUpload: true
        };
        // console.log('bundle after -> ', JSON.stringify(bundle));

        //reset entries filters redux
        this.props.performEntriesFilterReset();

        this.props.fetchChildEntries(bundle);
    }

    close () {

        const { projectSlug, currentBranchRef, isViewingChildren } = this.props;

        if (this.clonedReverseEntries.length > 0) {

            if (window.confirm('Are you sure? This will stop the uploads')) {
                //set this flag so we can keep the modal open showing a loader while waiting for a page
                //refresh in the background to show the just uploaded entries
                this.wasInterruptedUpload = true;

                //empty arrays to stop recursive uploads
                this.failedReverseEntries = [];
                this.clonedReverseEntries = [];

                //clear responses on close (that clears the table as well)
                this.setState(() => {
                    return {
                        responses: [],
                        failedResponses: []
                    };
                }, () => {
                    //refresh table (modal gets close when table refreshes)
                    //Show modal while parsing csv file
                    if (currentBranchRef === null) {
                        //are we viewing child entries?
                        if (isViewingChildren) {
                            //todo update navbar with total child entries
                            this.getChildEntries();
                        } else {
                            this.props.fetchProjectAndEntries(projectSlug, null);
                        }
                    } else {
                        //get branch entries
                        this.getBranchEntries();
                    }
                });
            }
        } else {
            //reset arrays
            this.failedReverseEntries = [];
            this.clonedReverseEntries = [];

            //clear responses on close (that clears the table as well)
            this.setState(() => {
                return {
                    responses: [],
                    failedResponses: []
                };
            }, () => {
                //refresh table (modal gets close when table refreshes)
                if (currentBranchRef === null) {
                    if (isViewingChildren) {
                        //todo update navbar with total child entries
                        this.getChildEntries();
                    } else {
                        this.props.fetchProjectAndEntries(projectSlug, null);
                    }
                } else {
                    //get the branch entries
                    this.getBranchEntries();
                }
            });
        }
    }

    componentDidMount () {
        console.log(' 1 -modal upload mounted');
    }

    componentDidUpdate () {

        console.log('2 - modal upload updated');
        //   this.isFirstRun = true;

        const { showModalUploadEntries } = this.props;

        //clear flag here so the uploads start each time a file is chosen,
        //but we do not end up in an infinite loop
        if (!showModalUploadEntries) {
            this.isFirstRun = true;
        }

        if (this.clonedReverseEntries.length === 0) {
            console.log(' think we are done at this point?');
            //are there any failed entries?
            if (this.failedReverseEntries.length > 0 && !this.wasInterruptedUpload) {
                this.props.setFailedReverseEntries(this.failedReverseEntries);
            }
        }
    }

    componentWillUnmount () {
        console.log('modal upload unmounted ************************************************');
    }


    render () {
        console.log('rendering upload entries modal');

        const { showModalUploadEntries, projectSlug, reverseEntries, projectMapping, activeMapping, hierarchyNavigator } = this.props;

        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;

        if (this.isFirstRun) {
            this.clonedReverseEntries = reverseEntries.slice(0);
            this.wasInterruptedUpload = false;
        }

        const uploadEntries = (entry) => {

            //console.log('POST entry -> ', JSON.stringify(entry));
            console.log('Posting entry..........................');

            requests.uploadOneEntry(entry, projectSlug).then((response) => {

                if (!this.wasInterruptedUpload) {
                    if (response.errors) {

                        this.failedReverseEntries.push(...[entry, entry]);

                        this.setState((state) => {
                            return {
                                responses: state.responses.concat([response, response]),
                                failedResponses: state.failedResponses.concat([response, response])
                            };
                        }, () => {
                            if (this.clonedReverseEntries.length !== 0) {
                                window.setTimeout(() => {
                                    uploadEntries(this.clonedReverseEntries.shift());
                                }, 2 * PARAMETERS.DELAY.LONG);
                            }
                        });
                    } else {
                        this.setState((state) => {
                            return {
                                responses: state.responses.concat([response, response])
                            };
                        }, () => {
                            if (this.clonedReverseEntries.length !== 0) {
                                window.setTimeout(() => {
                                    uploadEntries(this.clonedReverseEntries.shift());
                                }, 2 * PARAMETERS.DELAY.LONG);
                            }
                        });
                    }
                }
            });
        };

        if (showModalUploadEntries && reverseEntries.length > 0) {
            if (this.isFirstRun) {
                uploadEntries(this.clonedReverseEntries.shift());
                this.isFirstRun = false;
            }
        }

        if (!showModalUploadEntries) {
            return null;
        }

        const mapping = projectMapping[activeMapping.map_index].forms[currentFormRef];
        const responses = this.state.responses;
        const failedResponses = this.state.failedResponses;
        const showPagination = this.clonedReverseEntries.length === 0 && (responses.length / 2) > PARAMETERS.TABLE_UPLOAD_PER_PAGE;
        const { uploadTablePrevBtnEnabled, uploadTableNextBtnEnabled, filterByFailed } = this.props;
        const paginationPrevBtnClass = uploadTablePrevBtnEnabled ? '' : 'disabled';
        let paginationNextBtnClass = '';

        if (filterByFailed) {
            //enable when button can be enabled (paging) and also the number of failed response need to be paginated
            if (!(uploadTableNextBtnEnabled && (failedResponses.length / 2 > PARAMETERS.TABLE_UPLOAD_PER_PAGE))) {
                paginationNextBtnClass = 'disabled';
            }
        } else {
            //enable when button can be enabled (paging) and also the number of responses need to be paginated
            if (!(uploadTableNextBtnEnabled && (responses.length / 2 > PARAMETERS.TABLE_UPLOAD_PER_PAGE))) {
                paginationNextBtnClass = 'disabled';
            }
        }

        return (
            <Modal
                className="modal-upload-entries__wrapper"
                show={showModalUploadEntries}
                onHide={this.close}
                backdrop="static"
                dialogClassName="modal-upload-entries"
            >
                <div>
                    <Modal.Header closeButton>
                        <span className="cell-delete__entry-title">Uploading entries</span>
                    </Modal.Header>
                    <Modal.Body>
                        {responses.length === 0 || this.wasInterruptedUpload ?
                            <Loader />
                            :
                            <TableUploadWrapper
                                responses={responses}
                                failedResponses={failedResponses}
                                mapping={mapping}
                            />
                        }
                    </Modal.Body>
                    <Modal.Footer>
                        {/* Only show pagination when upload is done (and pagination is needed), like close button*/}
                        {showPagination && responses.length > 0 ?
                            <ul className="pagination upload-entries-pagination pull-right">
                                <li
                                    className={paginationPrevBtnClass}
                                    onClick={this.handleClickPrev}
                                >
                                    <a className="prev" rel="prev">«</a>
                                </li>
                                <li
                                    className={paginationNextBtnClass}
                                    onClick={this.handleClickNext}
                                >
                                    <a className="next " rel="next">»</a>
                                </li>
                            </ul>
                            :
                            null
                        }
                    </Modal.Footer>
                </div>
            </Modal>
        );
    }
}

ModalUploadEntries.propTypes = {
    reverseEntries: React.PropTypes.array,
    forms: React.PropTypes.array,
    projectSlug: React.PropTypes.string,
    currentBranchRef: React.PropTypes.string,
    currentBranchOwnerUuid: React.PropTypes.string,
    currentBranchOwnerEntryTitle: React.PropTypes.string,
    branchBackLink: React.PropTypes.string,
    setFailedReverseEntries: React.PropTypes.func,
    fetchBranchEntries: React.PropTypes.func,
    updateUploadTablePaginationState: React.PropTypes.func,
    toggleWaitOverlay: React.PropTypes.func,
    fetchProjectAndEntries: React.PropTypes.func,
    showModalUploadEntries: React.PropTypes.bool,
    filterByFailed: React.PropTypes.bool,
    hierarchyNavigator: React.PropTypes.array,
    projectMapping: React.PropTypes.array,
    activeMapping: React.PropTypes.object,
    uploadTablePrevBtnEnabled: React.PropTypes.bool,
    uploadTableNextBtnEnabled: React.PropTypes.bool,
    isViewingChildren: React.PropTypes.bool,
    uploadTablePageStart: React.PropTypes.number,
    uploadTablePageEnd: React.PropTypes.number,
    projectExtra: React.PropTypes.object,
    performEntriesFilterReset: React.PropTypes.func,
    fetchChildEntries: React.PropTypes.func
};


//get app state and map to props
const mapStateToProps = (state) => {
    return {
        forms: state.projectReducer.projectDefinition.project.forms,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectExtra: state.projectReducer.projectExtra,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentFormName: state.navigationReducer.currentFormName,
        currentBranchOwnerUuid: state.navigationReducer.currentBranchOwnerUuid,
        currentBranchOwnerEntryTitle: state.navigationReducer.currentBranchOwnerEntryTitle,
        branchBackLink: state.navigationReducer.branchBackLink,
        entryUuid: state.modalReducer.entryUuid,
        showModalUploadEntries: state.modalReducer.showModalUploadEntries,
        reverseEntries: state.tableReducer.reverseEntries,
        projectMapping: state.projectReducer.projectMapping,
        reverseMapping: state.tableReducer.reverseMapping,
        activeMapping: state.drawerReducer.activeMapping,
        filterByFailed: state.tableReducer.filterByFailed,
        isViewingChildren: state.navigationReducer.isViewingChildren,
        uploadTablePageStart: state.modalReducer.uploadTablePageStart,
        uploadTablePageEnd: state.modalReducer.uploadTablePageEnd,
        uploadTablePrevBtnEnabled: state.modalReducer.uploadTablePrevBtnEnabled,
        uploadTableNextBtnEnabled: state.modalReducer.uploadTableNextBtnEnabled
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalUploadEntries,
        setFailedReverseEntries,
        fetchProjectAndEntries,
        updateUploadTablePaginationState,
        toggleWaitOverlay,
        performEntriesFilterReset,
        fetchChildEntries,
        fetchBranchEntries
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(ModalUploadEntries);
