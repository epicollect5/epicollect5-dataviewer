import React from 'react';
import { Cell } from 'fixed-data-table-2';


class CellStatus extends React.Component {

    render() {

        const { rowIndex, responses } = this.props;

        if (responses[rowIndex].status) {
            return (
                <Cell>
                    <div className="status-success text-center">
                        <span className="material-icons">
                                done
                        </span>
                    </div>
                </Cell>
            );
        }
        return (
            <Cell>
                <div className="status-failed text-center">
                        <span className="material-icons">
                                warning
                        </span>
                </div>
            </Cell>
        );
    }
}

CellStatus.propTypes = {
    rowIndex: React.PropTypes.number,
    responses: React.PropTypes.array
};

export default CellStatus;

