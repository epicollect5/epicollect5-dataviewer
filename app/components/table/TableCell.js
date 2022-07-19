import React from 'react';
import CellBranch from 'containers/table/CellBranch';
import CellChildren from 'containers/table/CellChildren';
import CellMedia from 'components/table/CellMedia';
import CellText from 'components/table/CellText';
import CellView from 'containers/table/CellView';
import CellDelete from 'containers/table/CellDelete';
import CellEdit from 'containers/table/CellEdit';

class TableCell extends React.Component {

    render() {
        const cellComponents = {
            CellBranch,
            CellChildren,
            CellMedia,
            CellText,
            CellView,
            CellDelete,
            CellEdit
        };

        const cellType = this.props.content.cellType;
        const Cell = cellComponents[cellType];

        return (<Cell{...this.props}/>);
    }
}

TableCell.propTypes = {
    content: React.PropTypes.object
};

export default TableCell;
