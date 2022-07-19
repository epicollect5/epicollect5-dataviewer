import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { filterByFailed, showToastFileDownloadError } from 'actions';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import helpers from 'utils/helpers';

class UploadTableControls extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showOnlyfailed: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleClickDownloadFailedRows = this.handleClickDownloadFailedRows.bind(this);
    }

    //handle filter by failed checkbox
    handleChange(e) {

        const isChecked = e.target.checked;
        const { failedReverseEntries } = this.props;

        if (failedReverseEntries.length === 0) {
            return;
        }

        this.setState({ showOnlyfailed: isChecked }, () => {
            //tell redux to filter by failed
            this.props.filterByFailed(isChecked);
        });
    }

    //download failed rows in csv format
    handleClickDownloadFailedRows(e) {
        const {
            uploadedRows, responses, projectSlug, currentFormRef, projectDefinition,
            currentFormName, activeMapping, bulkUploadableHeaders, currentBranchRef
        } = this.props;

        const failedRows = [];
        const mapName = activeMapping.name;
        const forms = projectDefinition.project.forms;
        const currentFormIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
        const inputs = forms[currentFormIndex].inputs;
        let currentBranchName = '';

        //is this a branch entries upload? Get branch name
        if (currentBranchRef) {
            inputs.forEach((input) => {
                if (input.ref === currentBranchRef) {
                    currentBranchName = input.question;
                    return false;
                }
            });
        }

        //get only failed rows from the uploaded rows
        responses.forEach((response, index) => {
            if (!helpers.isOdd(index)) {
                if (response.errors) {
                    //important: index must be divided by 2 as responses get duplicated
                    const currentRow = uploadedRows[index / 2];
                    //remove non bulk-uploadable headers from failed row object
                    //Media types, if any, will be dealt with during the upload by uploading an empty answer
                    Object.keys(currentRow).forEach((key) => {
                        if (bulkUploadableHeaders.indexOf(key) === -1) {
                            delete currentRow[key];
                        }
                    });
                    failedRows.push(currentRow);
                }
            }
        });

        //no failed rows? Bail out
        if (failedRows.length === 0) {
            return;
        }

        const data = Papa.unparse(failedRows);

        //build file name replacing spaces in form name with dashes
        let filename = '';
        if (currentBranchRef) {
            filename = projectSlug + '__' + currentFormName.replace(/\s+/g, '-') + '__' + currentBranchName
                .substring(0, 50).replace(/\s+/g, '-') + '__' + mapName + '__failed-rows.csv';
        } else {

            filename = projectSlug + '__' + currentFormName.replace(/\s+/g, '-') + '__' + mapName + '__failed-rows.csv';
        }

        try {
            const file = new File([data], filename, { type: 'text/plain:charset=utf-8' });
            saveAs(file);
            //use e.preventDefault() otherwise it will reload the page, go figure :/
            e.preventDefault();
        } catch (error) {
            //Microsoft browsers?
            if (navigator.msSaveBlob) {
                return navigator.msSaveBlob(new Blob([data], { type: 'text/plain:charset=utf-8' }), filename);
            }
            //browser not supported yet
            this.props.showToastFileDownloadError();
        }
    }

    componentDidUpdate() {
        console.log('UploadTableControls updated');
    }

    render() {

        const { responses, reverseEntries, failedReverseEntries } = this.props;

        const now = ((responses.length / 2) / reverseEntries.length) * 100;

        if (now === 100) {
            return (
                <div className="uploading-entries__table-controls animated fadeIn">
                    <form>
                        <div className="checkbox">
                            {failedReverseEntries.length > 0 ?
                                <label htmlFor="filter-failed">
                                    <input
                                        id="filter-failed"
                                        type="checkbox"
                                        onChange={this.handleChange}
                                        checked={this.state.showOnlyfailed}
                                        disabled={failedReverseEntries.length === 0}
                                    />
                                    Show only failed rows
                                </label>
                                :
                                <label htmlFor="all-entries-uploaded">
                                    <input
                                        id="all-entries-uploaded"
                                        type="checkbox"
                                        checked
                                        disabled
                                    />
                                    All entries uploaded
                                </label>
                            }
                            <div className="pull-right">
                                <div
                                    className="btn btn-action btn-sm"
                                    onClick={(e) => {
                                        this.handleClickDownloadFailedRows(e);
                                    }}
                                    disabled={failedReverseEntries.length === 0}
                                >
                                    <span className="hidden-xs">
                                        Download failed rows
                                    </span>
                                    <span className=" visible-xs material-icons">
                                        get_app
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>);
        }

        return (
            <div className="uploading-entries-loader">
                <div
                    className="uploading-entries-loader__label"
                >
                    Uploading <strong>{(responses.length / 2)}</strong> of <strong>{reverseEntries.length}</strong> entries
                </div>
                <ProgressBar now={now} />
            </div>
        );
    }
}

UploadTableControls.propTypes = {
    responses: React.PropTypes.array,
    reverseEntries: React.PropTypes.array,
    failedReverseEntries: React.PropTypes.array,
    uploadedRows: React.PropTypes.array,
    projectSlug: React.PropTypes.string,
    currentFormName: React.PropTypes.string,
    currentBranchRef: React.PropTypes.string,
    filterByFailed: React.PropTypes.func,
    showToastFileDownloadError: React.PropTypes.func,
    activeMapping: React.PropTypes.object,
    bulkUploadableHeaders: React.PropTypes.array,
    currentFormRef: React.PropTypes.string,
    projectDefinition: React.PropTypes.object

};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        reverseEntries: state.tableReducer.reverseEntries,
        failedReverseEntries: state.tableReducer.failedReverseEntries,
        activeMapping: state.drawerReducer.activeMapping,
        uploadedRows: state.tableReducer.uploadedRows,
        projectSlug: state.projectReducer.projectDefinition.project.slug,
        projectDefinition: state.projectReducer.projectDefinition,
        currentFormName: state.navigationReducer.currentFormName,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        bulkUploadableHeaders: state.tableReducer.bulkUploadableHeaders
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        filterByFailed,
        showToastFileDownloadError
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(UploadTableControls);
