import React from 'react';
import TableCell from 'components/table/TableCell';

class TableBody extends React.Component {

    render() {
        return (
            <tbody>
            {this.props.tableRows.map((row, rowIndex) => {
                return (
                    <tr key={rowIndex}>{row.map((cellContent, cellIndex) => {
                        return (
                            <td key={cellIndex}>
                                <TableCell key={cellIndex} content={cellContent}/>
                            </td>);
                    })}
                    </tr>);
            })}
            </tbody>
        );
    }
}

export default TableBody;

TableBody.propTypes = {
    tableRows: React.PropTypes.array.isRequired
};
