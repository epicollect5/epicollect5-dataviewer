import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import RowStatusBootstrap from 'components/upload-table/RowStatusBootstrap';
import RowAnswerBootstrap from 'components/upload-table/RowAnswerBootstrap';
import RowHeadersBootstrap from 'components/upload-table/RowHeadersBootstrap';
import PARAMETERS from 'config/parameters';

import { toggleWaitOverlay } from 'actions';


class UploadTableBootstrap extends React.Component {

    constructor(props) {
        super(props);

        this.renderStatusRows = this.renderStatusRows.bind(this);
        this.renderHeadersRow = this.renderHeadersRow.bind(this);
        this.renderAnswersRows = this.renderAnswersRows.bind(this);
    }

    // componentDidMount() {
    //   //  window.addEventListener('beforeunload', this.handleUnload);
    // }

    // componentWillUnmount() {
    //  //   window.removeEventListener('beforeunload', this.handleUnload);
    // }

    // handleUnload(e) {
    //     // Cancel the event
    //     e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    //     // Chrome requires returnValue to be set
    //     e.returnValue = '';
    // }

    componentDidUpdate() {
        console.log('UploadTable updated ********************************** ->');
    }

    renderHeadersRow(mapping) {
        return (
            <RowHeadersBootstrap
                {...this.props}
                mapping={mapping}
            />
        );
    }

    //render upload status per each row (pass/fail)
    renderStatusRows(rows) {
        return (rows.map((response, rowIndex) => {
            return (
                <RowStatusBootstrap
                    {...this.props}
                    key={rowIndex}
                    rowIndex={rowIndex}
                    responses={rows}
                    expandRowCallback={this.expandRowCallback}
                />
            );
        }));
    }

    renderAnswersRows(responses) {

        const { uploadedRows } = this.props;
        const { uploadTablePageStart, uploadTablePageEnd } = this.props;
        const perPage = PARAMETERS.TABLE_UPLOAD_PER_PAGE;
        const uploadedRowsToRender = uploadedRows.slice(uploadTablePageStart * perPage, uploadTablePageEnd * perPage);

        return (responses.map((row, rowIndex) => {
            return (
                <RowAnswerBootstrap
                    {...this.props}
                    key={rowIndex}
                    rowIndex={rowIndex}
                    responses={responses}
                    uploadedRows={uploadedRowsToRender}
                />);
        }));
    }


    render() {

        const { responses, failedResponses, filterByFailed, mapping } = this.props;
        const dataArray = filterByFailed ? failedResponses : responses;
        const { uploadTablePageStart, uploadTablePageEnd } = this.props;
        const perPage = PARAMETERS.TABLE_UPLOAD_PER_PAGE;

        //Important, dataArray have 2 * responses as each response is duplicated
        const rowsToRender = dataArray.slice(2 * uploadTablePageStart * perPage, 2 * uploadTablePageEnd * perPage);

        return (
            <div className="upload-table-container">
                <table className="table table-bordered upload-table-left">
                    <thead>
                        <tr>
                            <th>
                                &nbsp;
                            </th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderStatusRows(rowsToRender)}
                    </tbody>
                </table>
                <div className="upload-table-right">
                    <table className="table table-bordered">
                        <thead>
                            {/*Render dynamic columns, one per each question (header)*/}
                            {this.renderHeadersRow(mapping)}
                        </thead>
                        <tbody>
                            {this.renderAnswersRows(rowsToRender)}
                        </tbody>
                    </table>
                </div>
            </div>);
    }
}


UploadTableBootstrap.propTypes = {
    responses: React.PropTypes.array,
    failedResponses: React.PropTypes.array,
    uploadedRows: React.PropTypes.array,
    mapping: React.PropTypes.object,
    filterByFailed: React.PropTypes.bool,
    uploadTablePageStart: React.PropTypes.number,
    uploadTablePageEnd: React.PropTypes.number
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        reverseEntries: state.tableReducer.reverseEntries,
        failedReverseEntries: state.tableReducer.failedReverseEntries,
        filterByFailed: state.tableReducer.filterByFailed,
        expandedErrorRows: state.tableReducer.expandedErrorRows,
        generatedUuids: state.tableReducer.generatedUuids,
        uploadedRows: state.tableReducer.uploadedRows,
        projectExtra: state.projectReducer.projectExtra,
        projectDefinition: state.projectReducer.projectDefinition,
        currentFormRef: state.navigationReducer.currentFormRef,
        currentBranchRef: state.navigationReducer.currentBranchRef,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator,
        uploadTablePageStart: state.modalReducer.uploadTablePageStart,
        uploadTablePageEnd: state.modalReducer.uploadTablePageEnd,
        uploadTablePrevBtnEnabled: state.modalReducer.uploadTablePrevBtnEnabled,
        uploadTableNextBtnEnabled: state.modalReducer.uploadTableNextBtnEnabled
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleWaitOverlay
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(UploadTableBootstrap);
