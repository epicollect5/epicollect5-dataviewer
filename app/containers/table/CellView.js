import React from 'react';
import { bindActionCreators } from 'redux';
import { toggleModalViewEntry } from 'actions';
import { connect } from 'react-redux';

import PARAMETERS from 'config/parameters';


class CellView extends React.Component {

    constructor(props) {
        super(props);

        this.handleClickView = this.handleClickView.bind(this);
    }

    handleClickView(headers, entryTitle) {

        const { isBranchTable, content } = this.props;
        const singleEntryFlat = content.singleEntryFlat;
        let answers = [];

        console.log(this.props.content);

        if (isBranchTable) {
            //remove the fixed headers from the single entry flat, we do not show them
            answers = singleEntryFlat.slice(PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1, singleEntryFlat.length);
        } else {
            //remove the fixed headers from the single entry flat, we do not show them
            answers = singleEntryFlat.slice(PARAMETERS.TABLE_FIXED_HEADERS_TOTAL, singleEntryFlat.length);
        }
        this.props.toggleModalViewEntry(headers, answers, entryTitle);
    }

    render() {
        const { headers, entryTitle } = this.props;
        return (
            <div className="cell-view">
                <button
                    className="btn btn-default btn-action btn-icon"
                    onClick={() => {
                        this.handleClickView(headers, entryTitle);
                    }}
                >
                    <i className="material-icons">remove_red_eye</i>
                </button>
            </div>
        );
    }
}

CellView.propTypes = {
    isBranchTable: React.PropTypes.bool,
    content: React.PropTypes.object,
    toggleModalViewEntry: React.PropTypes.func,
    entryTitle: React.PropTypes.string,
    headers: React.PropTypes.array
};

const mapStateToProps = (state) => {
    return {
        headers: state.tableReducer.headers
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({
        toggleModalViewEntry
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(CellView);
