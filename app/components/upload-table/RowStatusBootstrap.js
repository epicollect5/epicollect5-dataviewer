import React from 'react';
import helpers from 'utils/helpers';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { setExpandedErrorRows } from 'actions';


class RowStatusBootstrap extends React.Component {

    constructor(props) {
        super(props);

        this.handleClickExpandRow = this.handleClickExpandRow.bind(this);
    }

    handleClickExpandRow(rowIndex) {
        console.log(rowIndex);

        const { expandedErrorRows } = this.props;

        expandedErrorRows[rowIndex + 1] = !expandedErrorRows[rowIndex + 1];

        //we use slice(0) to pass a real copy of the modified array,
        //as redux immutable pattern
        this.props.setExpandedErrorRows(expandedErrorRows.slice(0));
    }

    render() {

        const { rowIndex, responses, expandedErrorRows } = this.props;
        const baseClassName = 'upload-entries__error-row animated fadeIn';
        const dynamicClassName = expandedErrorRows[rowIndex] ? baseClassName : baseClassName + ' hidden';

        if (helpers.isOdd(rowIndex)) {
            return (
                <tr className={dynamicClassName}>
                    <td />
                    <td />
                </tr>);
        }

        //show single tick for new uploads, double tick for updated entries
        if (responses[rowIndex].status) {

            //was it a new entry upload or an update?
            const wasEntryUpdated = responses[rowIndex].data.data.code === 'ec5_357';
            return (
                <tr>
                    <td />
                    <td className="icon-cell">
                        <div className="status-success text-center">
                            {wasEntryUpdated ?
                                <span className="material-icons">
                                     done_all
                                </span>
                                :
                                <span className="material-icons">
                                     done
                                </span>
                            }
                        </div>
                    </td>
                </tr>
            );
        }

        //show error and button to expand error row
        return (<tr>
            <td>
                <button
                    className="btn btn-default btn-action btn-icon btn-view-upload-errors"
                    onClick={() => {
                        this.handleClickExpandRow(rowIndex);
                    }}
                >
                    {/*Icon changes based on state (expanded/not expanded)*/}
                    {expandedErrorRows[rowIndex + 1] ?
                        < i className="material-icons">expand_less</i>
                        :
                        < i className="material-icons">expand_more</i>
                    }
                </button>
            </td>
            <td className="icon-cell">
                <div className="status-failed text-center">
                        <span className="material-icons">
                                warning
                        </span>
                </div>
            </td>
        </tr>);
    }
}


RowStatusBootstrap.propTypes = {
    rowIndex: React.PropTypes.number,
    responses: React.PropTypes.array,
    expandedErrorRows: React.PropTypes.array,
    setExpandedErrorRows: React.PropTypes.func
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        reverseEntries: state.tableReducer.reverseEntries,
        failedReverseEntries: state.tableReducer.failedReverseEntries,
        filterByFailed: state.tableReducer.filterByFailed,
        expandedErrorRows: state.tableReducer.expandedErrorRows,
        uploadedRows: state.tableReducer.uploadedRows
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        setExpandedErrorRows
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(RowStatusBootstrap);

