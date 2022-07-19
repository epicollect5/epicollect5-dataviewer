import React from 'react';
import { connect } from 'react-redux';
import Papa from 'papaparse';
import ObjectValuesPolyfill from 'object.values';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import FileUploader from 'components/FileUploader';
import reverseEntryParser from 'utils/reverse-entry-parser';
import {
    toggleModalUploadEntries,
    toggleDrawerUpload,
    toggleModalPrepareDownload,
    setActiveMapping,
    setReverseEntries,
    showToastFileUploadError,
    setUploadedRows,
    setBulkUploadableHeaders,
    setGeneratedUuids
} from 'actions';
import DropdownButton from 'react-bootstrap/lib/DropdownButton';
import { bindActionCreators } from 'redux';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';
import axios from 'axios/index';
import Cookies from 'universal-cookie';

class DrawerUpload extends React.Component {

    constructor(props) {
        super(props);

        this.onToggleDrawer = this.onToggleDrawer.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
        this.handleSelectedMappingChange = this.handleSelectedMappingChange.bind(this);
        this.handleDownloadTemplateClick = this.handleDownloadTemplateClick.bind(this);
        this.handleDownloadSubsetClick = this.handleDownloadSubsetClick.bind(this);

        this.state = {
            fileSelected: null
        };
    }

    onToggleDrawer(showDrawerUpload) {
        this.props.toggleDrawerUpload(showDrawerUpload);
    }

    handleDownloadTemplateClick() {
        //get current form index and current mapping index
        const {
            hierarchyNavigator, activeMapping, projectDefinition, currentBranchRef
        } = this.props;
        const mapIndex = activeMapping.map_index;
        const mapName = activeMapping.name;
        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const forms = projectDefinition.project.forms;
        const projectSlug = projectDefinition.project.slug;
        let formIndex = 0;
        let formName = '';
        const format = PARAMETERS.FORMAT_CSV;
        const requestTimestamp = new Date().getTime();
        const cookies = new Cookies();
        const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
        const delay = 3000;

        //show loader
        this.props.toggleModalPrepareDownload(true);

        forms.forEach((form, index) => {
            if (form.ref === currentFormRef) {
                formIndex = index;
                formName = form.name;
            }
        });
        const filename = projectSlug + '__' + formName + '__' + mapName + '__upload-template';

        const endpoint = helpers.getUploadTemplateEndpoint({
            projectSlug,
            mapIndex,
            formIndex,
            currentBranchRef,
            format,
            requestTimestamp,
            filename
        });

        //start pooling for the cookie to get back
        const intervalID = window.setInterval(() => {
            //if the cookie is set and the timestamp matches, hide modal and stop interval
            if (cookies.get(requestCookie) === requestTimestamp.toString()) {
                this.props.toggleModalPrepareDownload(false);
                clearInterval(intervalID);
                cookies.remove(requestCookie);
            }
        }, PARAMETERS.DELAY.SHORT);

        //request download endpoint
        window.setTimeout(() => {
            //IMPORTANT: this is done othewise cookies do not get set with file saver
            window.location.href = endpoint;
            // saveAs(endpoint, filename);
        }, delay);
    }

    handleDownloadSubsetClick() {
        //get current form index and current mapping index
        const {
            filterByTitle, filterStartDate, filterEndDate, filterSortOrder,
            hierarchyNavigator, activeMapping, projectDefinition, currentBranchRef, currentBranchOwnerUuid
        } = this.props;
        const mapName = activeMapping.name;
        const projectSlug = projectDefinition.project.slug;
        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const forms = projectDefinition.project.forms;
        let formName = '';
        forms.forEach((form) => {
            if (form.ref === currentFormRef) {
                formName = form.name;
            }
        });
        const requestTimestamp = new Date().getTime();
        const cookies = new Cookies();
        const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
        const delay = 3000;

        //show loader
        this.props.toggleModalPrepareDownload(true);

        const filename = projectSlug + '__' + formName + '__' + mapName + '__subset.zip';
        const endpoint = helpers.getDownloadSubsetEndpoint({
            projectSlug,
            hierarchyNavigator,
            filterByTitle,
            filterStartDate,
            filterEndDate,
            filterSortOrder,
            requestTimestamp,
            filename,
            currentBranchRef,
            currentBranchOwnerUuid
        });

        //start pooling for the cookie to get back
        const intervalID = window.setInterval(() => {
            //if the cookie is set and the timestamp matches, hide modal and stop interval
            if (cookies.get(requestCookie) === requestTimestamp.toString()) {
                this.props.toggleModalPrepareDownload(false);
                clearInterval(intervalID);
                cookies.remove(requestCookie);
            }
        }, PARAMETERS.DELAY.SHORT);

        //request download endpoint
        window.setTimeout(() => {
            //IMPORTANT: this is done othewise cookies do not get set with file saver
            window.location.href = endpoint;
            // saveAs(endpoint, filename);
        }, delay);

        console.log('Subset endpoint', endpoint);
    }

    handleFileChange(file) {

        if (file) {
            this.setState({ fileSelected: file.name });
        }

        const fileParts = file.name.split('.');
        const fileExt = fileParts[fileParts.length - 1];

        //it must be csv
        if (fileExt !== PARAMETERS.FORMAT_CSV) {
            //hide overlay
            console.log('error');
            return false;
        }
        //file is valid, let's parse it
        const reader = new FileReader();

        reader.onload = (e) => {

            const content = e.target.result;
            const rows = [];
            let headers = [];
            const parseErrors = [];

            //Show modal while parsing csv file
            this.props.toggleModalUploadEntries();

            Papa.parse(content, {
                step: (results, parser) => {

                    if (rows.length < PARAMETERS.TABLE_UPLOAD_MAX_ROWS) {
                        rows.push(results.data);
                        parseErrors.push(...results.errors);
                    }

                    //bail out after the first error
                    if (results.errors.length > 0) {
                        parser.abort();
                    } else {
                        if (headers.length === 0) {
                            headers = results.meta.fields;
                        }
                    }
                },
                // worker: true,
                complete: () => {
                    const {
                        hierarchyNavigator, projectMapping, projectExtra, activeMapping, projectStats, currentBranchRef, currentBranchOwnerUuid, projectSlug, projectDefinition
                    } = this.props;
                    const mapIndex = activeMapping.map_index;
                    const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
                    let currentBranchIndex;

                    const projectVersion = projectStats.structure_last_updated;
                    const forms = projectDefinition.project.forms;
                    const formIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
                    let inputs = projectDefinition.project.forms[formIndex].inputs;
                    let currentFormMapping = projectMapping[mapIndex].forms[currentFormRef];

                    //are we uploading branch entries?
                    if (currentBranchRef !== null) {
                        //ok, override mapping and inputs with branch inputs and mapping
                        currentFormMapping = projectMapping[mapIndex].forms[currentFormRef][currentBranchRef].branch;
                        currentBranchIndex = helpers.getBranchInputIndexFromRef(inputs, currentBranchRef);
                        inputs = projectDefinition.project.forms[formIndex].inputs[currentBranchIndex].branch;
                    }

                    //the following fails if the file content is not readable as csv.
                    if (rows.length === 0) {
                        //hide modal and show error
                        this.props.toggleModalUploadEntries();
                        this.props.showToastFileUploadError(PARAMETERS.LABELS.FILE_UPLOAD_ERROR_NO_ROWS);
                        return false;
                    }

                    //are there any parse errors?
                    if (parseErrors.length > 0) {
                        //hide modal and show error
                        this.props.toggleModalUploadEntries();
                        this.props.showToastFileUploadError();
                        return false;
                    }

                    //generate reverse mapping per each row
                    //todo filter out not bulk-uploadable question types??
                    const reverseMapping = reverseEntryParser.getReverseMapping(currentFormRef, currentFormMapping, projectExtra, projectDefinition, currentBranchRef);

                    //check uploaded file has all the bulk uploadable headers
                    const endpoint = helpers.getUploadHeadersEndpoint({
                        projectSlug,
                        mapIndex,
                        formIndex,
                        currentBranchRef,
                        format: 'json'
                    });

                    axios.get(endpoint)
                        .then((response) => {
                            const bulkUploadableHeaders = response.data.data.headers;
                            //if one header is missing, bail out
                            if (!bulkUploadableHeaders.every((header) => {
                                return headers.indexOf(header) > -1;
                            })) {
                                //hide modal and show error
                                this.props.toggleModalUploadEntries();
                                this.props.showToastFileUploadError(PARAMETERS.LABELS.FILE_MAPPING_ERROR);
                                return false;
                            }
                            //generate the answers in the upload format
                            const branches = Object.keys(projectExtra.forms[currentFormRef].branch);
                            const inputsExtra = projectExtra.inputs;
                            const reverseAnswers = reverseEntryParser.getReverseAnswers(rows, reverseMapping, branches, currentBranchRef, inputsExtra);
                            /**
                             * Are there any groups?
                             * Add all the group owner refs to the answers
                             * need to do that here since there in no header for the group , just for the group inputs.
                             *
                             * The request will go through anyway but for consistency with the other app, we add them here to the answers array
                             */

                            const groupRefs = projectExtra.forms[currentFormRef].group;

                            Object.keys(groupRefs).forEach((groupInputRef) => {
                                reverseAnswers.forEach((reverseAnswer) => {
                                    reverseAnswer.answer[groupInputRef] = {
                                        answer: '',
                                        was_jumped: false
                                    };
                                });
                            });


                            //ho headers found? Probably wrong mapping, bail out
                            if (Object.keys(reverseAnswers[0].answer).length === 0) {
                                //hide modal and show error
                                this.props.toggleModalUploadEntries();
                                this.props.showToastFileUploadError();
                                return false;
                            }

                            const entries = [];
                            let parentFormForUpload = {
                                parentFormRef: null,
                                parentEntryUuid: null
                            };

                            //When the following is one, users are navigating using the form switcher
                            if (hierarchyNavigator.length > 1) {
                                //users are navigating down the children/branches
                                parentFormForUpload = helpers.getParentFormForUpload(hierarchyNavigator, currentFormRef);
                            }

                            //parse all the reverse answers to get entry object for upload
                            const uuids = [];
                            const generatedUuids = [];
                            reverseAnswers.forEach((reverseAnswer) => {
                                //get uuid from answer to hanlde edit/update
                                let uuid = reverseAnswer.uuid;

                                const entryTitle = (reverseAnswer.title === null) ? uuid : reverseAnswer.title.trim();

                                //if uuid not provided, generate a new one
                                if (uuid === null) {
                                    uuid = helpers.generateUuid();
                                    generatedUuids.push(uuid);
                                }
                                //keep track of duplicate uuids (user might have tampered with them)
                                if (uuids.indexOf(uuid) === -1) {
                                    uuids.push(uuid);
                                }

                                //get entry object for upload
                                const entry = reverseEntryParser.getEntry({
                                    uuid,
                                    entryTitle,
                                    currentFormRef,
                                    reverseAnswer,
                                    projectVersion,
                                    parentFormRef: parentFormForUpload.parentFormRef,
                                    parentEntryUuid: parentFormForUpload.parentEntryUuid,
                                    currentBranchRef,
                                    currentBranchOwnerUuid
                                });

                                entries.push(entry);
                            });

                            if (entries.length > uuids.length) {
                                //some entries have duplicate uuid, bail out
                                this.props.toggleModalUploadEntries();

                                if (currentBranchRef) {
                                    this.props.showToastFileUploadError(PARAMETERS.LABELS.FILE_BRANCH_UUID_ERROR);
                                } else {
                                    this.props.showToastFileUploadError(PARAMETERS.LABELS.FILE_UUID_ERROR);
                                }
                            }

                            if (entries.length > 0) {
                                //handle jumps flow on entries
                                const entriesWithJumpsFlow = reverseEntryParser.setEntryJumps(entries, inputs, reverseMapping, currentBranchRef);

                                this.props.setReverseEntries(entriesWithJumpsFlow, reverseMapping);
                                this.props.setUploadedRows(rows);
                                this.props.setBulkUploadableHeaders(bulkUploadableHeaders);
                                this.props.setGeneratedUuids(generatedUuids);

                                //we have some rows to upload
                                //this.props.toggleModalUploadEntries();
                            }
                        })
                        .catch((error) => {
                            //general error, bail out
                            console.log(error);
                            //hide modal and show error
                            this.props.toggleModalUploadEntries();
                            this.props.showToastFileUploadError();
                        });
                },
                error: (error) => {
                    //hide modal and show error
                    this.props.toggleModalUploadEntries();
                    console.log(error);
                },
                header:
                    true,
                skipEmptyLines:
                    'greedy',
                delimiter:
                    ',',
                escapeChar: '"'
            }
            );
        };
        reader.readAsText(file);
    }

    getMappingItems(mappings) {
        const iterator = Object.values || ObjectValuesPolyfill;
        return iterator(mappings).map((mapping, index) => {
            return (
                <MenuItem
                    key={index}
                    eventKey={mapping}
                    onSelect={(event) => {
                        this.handleSelectedMappingChange(event);
                    }}
                >
                    {mapping.name}
                </MenuItem>
            );
        });
    }

    handleSelectedMappingChange(selectedMapping) {
        //change selected mapping dispatching action
        this.props.setActiveMapping(selectedMapping);
    }

    //todo need to find a way to get a different content based on what button was clicked to
    //open the drawer and the main navigation state (MAP OR TABLE)
    render() {
        const { showDrawerUpload } = this.props;
        const elementClass = showDrawerUpload ? 'show drawer' : 'drawer';
        const { projectMapping, activeMapping } = this.props;

        return (
            <div id="drawer__upload" className={elementClass}>
                <h2 className="drawer__header">
                    Upload
                    <a
                        onClick={() => {
                            this.onToggleDrawer(showDrawerUpload);
                        }}
                        className="drawer__close-btn pull-right"
                        role="button"
                    >
                        <i className="material-icons">keyboard_arrow_left</i>
                    </a>
                </h2>
                <div className="drawer-content">
                    <aside className="upload-controls">
                        <section className="panel panel-default download-controls__mapping">
                            <div className="panel-heading">
                                <h3 className="panel-title">Mapping</h3>
                            </div>
                            <div className="panel-body">
                                <div id="mappings" className="form-group">
                                    <DropdownButton
                                        title={activeMapping.name}
                                        key="mappings-dropdown"
                                        id="mappings-dropdown"
                                    >
                                        {this.getMappingItems(projectMapping)}
                                    </DropdownButton>
                                </div>
                            </div>
                        </section>
                        <section className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">
                                    File
                                    <code>(.csv)</code>
                                </h3>

                            </div>
                            <div className="panel-body">
                                <FileUploader
                                    handleFileChange={this.handleFileChange}
                                    handleFileError={this.props.showToastFileUploadError}
                                    selected={this.state.fileSelected}
                                />
                            </div>
                        </section>
                        <section className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">
                                    Current View Template
                                </h3>

                            </div>
                            <div className="panel-body text-center">
                                <button
                                    onClick={this.handleDownloadTemplateClick}
                                    className="btn btn-action"
                                >
                                    <span className="material-icons">
                                        get_app
                                    </span>
                                    &nbsp; Download
                                </button>
                            </div>
                        </section>
                        <section className="panel panel-default">
                            <div className="panel-heading">
                                <h3 className="panel-title">
                                    Current View Subset
                                </h3>

                            </div>
                            <div className="panel-body text-center">
                                <button
                                    onClick={this.handleDownloadSubsetClick}
                                    className="btn btn-action"
                                >
                                    <span className="material-icons">
                                        get_app
                                    </span>
                                    &nbsp; Download
                                </button>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        );
    }
}

//get app state and map to props
function mapStateToProps(state) {
    return {
        showDrawerUpload: state.drawerReducer.showDrawerUpload,
        projectMapping: state.projectReducer.projectMapping,
        projectStats: state.projectReducer.projectStats,
        projectExtra: state.projectReducer.projectExtra,
        projectDefinition: state.projectReducer.projectDefinition,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentFormName: state.navigationReducer.currentFormName,
        isViewingBranch: state.navigationReducer.isViewingBranch,
        activeMapping: state.drawerReducer.activeMapping,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        currentBranchOwnerUuid: state.navigationReducer.currentBranchOwnerUuid,
        filterByTitle: state.filterEntriesReducer.filterByTitle,
        filterStartDate: state.filterEntriesReducer.startDate,
        filterEndDate: state.filterEntriesReducer.endDate,
        filterSortOrder: state.filterEntriesReducer.sortOrder
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleDrawerUpload,
        toggleModalUploadEntries,
        setActiveMapping,
        setReverseEntries,
        showToastFileUploadError,
        setUploadedRows,
        setBulkUploadableHeaders,
        setGeneratedUuids,
        toggleModalPrepareDownload
    }, dispatch);
}

DrawerUpload.propTypes = {
    showDrawerUpload: React.PropTypes.bool,
    toggleDrawerUpload: React.PropTypes.func,
    toggleModalUploadEntries: React.PropTypes.func,
    toggleModalPrepareDownload: React.PropTypes.func,
    projectMapping: React.PropTypes.array,
    hierarchyNavigator: React.PropTypes.array,
    setActiveMapping: React.PropTypes.func,
    setReverseEntries: React.PropTypes.func,
    setGeneratedUuids: React.PropTypes.func,
    showToastFileUploadError: React.PropTypes.func,
    setUploadedRows: React.PropTypes.func,
    projectExtra: React.PropTypes.object,
    activeMapping: React.PropTypes.object,
    projectStats: React.PropTypes.object,
    projectDefinition: React.PropTypes.object,
    currentBranchRef: React.PropTypes.string,
    currentBranchOwnerUuid: React.PropTypes.string,
    projectSlug: React.PropTypes.string,
    setBulkUploadableHeaders: React.PropTypes.func,
    filterByTitle: React.PropTypes.string,
    filterStartDate: React.PropTypes.string,
    filterEndDate: React.PropTypes.string,
    filterSortOrder: React.PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps)(DrawerUpload);

