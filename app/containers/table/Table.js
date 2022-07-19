import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Table as FixedDataTable, Column, Cell } from 'fixed-data-table-2';

import TableCell from 'components/table/TableCell';
import Loader from 'components/Loader';
import PARAMETERS from 'config/parameters';
import helpers from 'utils/helpers';

class Table extends React.Component {

    componentDidUpdate() {
        console.log('Table updated ********************************** ->');
    }

    render() {

        //todo important! the table fits the layout so it adds an extra empty column to do that if needed, not a bug!!
        const { rows, headers, isBranchTable, isFetchingPage, projectUser, hierarchyNavigator, forms, containerWidth } = this.props;
        let isUserLoggedIn = PARAMETERS.IS_LOCALHOST === 1;
        const shouldColumnFixed = containerWidth > 768; //remove fixed columns on small screens, the whole table scroll

        if (isFetchingPage) {
            return (<Loader elementClass="table-loader" />);
        }

        //no entries -> just show a message
        if (rows.length === 0) {
            return (
                <div
                    className="table-no-entries animated fadeIn text-center "
                >
                    <h2> No entries found.</h2>
                </div>
            );
        }

        const tableTotalFixedHeaders = isBranchTable ? (PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1) : PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;
        const entryTitleRowIndex = isBranchTable ? PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX - 1 : PARAMETERS.TABLE_FIXED_HEADERS_TITLE_INDEX;
        const entryCreatedAtRowIndex = isBranchTable ? PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX - 1 : PARAMETERS.TABLE_FIXED_HEADERS_CREATED_AT_INDEX;
        const currentFormRef = hierarchyNavigator[hierarchyNavigator.length - 1].formRef;
        const childForm = helpers.getNextForm(forms, currentFormRef);

        console.log('projectUser.role', projectUser.role);

        //is the user logged in?
        if (projectUser.role !== null || projectUser.id !== null) {
            //the user must be logged in if either a role is set or a user is is set
            isUserLoggedIn = true;
        }

        //render the header cell for dynamic colums
        //this is needed for having the text on a single line with ellipsis
        const renderHeader = (header) => {
            return (
                <div className="cell-content-wrapper">
                    <div className="cell-content">
                        {header}
                    </div>
                </div>
            );
        };

        return (
            <FixedDataTable
                className="table-entries animated fadeIn"
                rowsCount={rows.length}
                rowHeight={50}
                headerHeight={50}
                // footerHeight={50}
                touchScrollEnabled
                width={this.props.containerWidth}
                height={this.props.containerHeight}
            >

                <Column
                    header={<Cell className="text-center">View</Cell>}
                    // footer={
                    //     <Cell className="text-center">
                    //         <button
                    //             className="btn btn-default btn-action-inverse btn-icon"
                    //         >
                    //             <i className="material-icons">publish</i>
                    //         </button>
                    //     </Cell>
                    // }
                    cell={
                        props => (
                            <TableCell
                                {...this.props}
                                rowIndex={props.rowIndex}
                                content={rows[props.rowIndex][0]}
                                entryTitle={rows[props.rowIndex][entryTitleRowIndex].answer}
                                isBranchTable={isBranchTable}
                            />)}
                    width={58}
                    fixed={shouldColumnFixed}
                />
                {isUserLoggedIn ?
                    < Column
                        header={<Cell className="text-center">Delete</Cell>}
                        cell={
                            props => (
                                <TableCell
                                    {...this.props}
                                    rowIndex={props.rowIndex}
                                    content={rows[props.rowIndex][1]}
                                    entryTitle={rows[props.rowIndex][entryTitleRowIndex].answer}
                                    entryExtra={rows[props.rowIndex][tableTotalFixedHeaders]}
                                />
                            )}
                        width={58}
                        fixed={shouldColumnFixed}
                    />
                    : null
                }
                {isUserLoggedIn ?
                    < Column
                        header={<Cell className="text-center">Edit</Cell>}
                        cell={
                            props => (
                                <TableCell
                                    {...this.props}
                                    rowIndex={props.rowIndex}
                                    content={rows[props.rowIndex][2]}
                                    entryTitle={rows[props.rowIndex][entryTitleRowIndex].answer}
                                    entryExtra={rows[props.rowIndex][tableTotalFixedHeaders]}
                                />
                            )}
                        width={58}
                        fixed={shouldColumnFixed}
                    />
                    : null
                }

                {isBranchTable === false && childForm !== false ?
                    <Column
                        header={<Cell>{renderHeader(childForm.name)}</Cell>}
                        cell={props => (
                            <TableCell
                                {...props}
                                content={rows[props.rowIndex][3]}
                                entryTitle={rows[props.rowIndex][4].answer}
                                entryExtra={rows[props.rowIndex][tableTotalFixedHeaders]}
                            />
                        )}
                        width={120}
                        fixed={shouldColumnFixed}
                    />
                    : null
                }
                <Column
                    header={<Cell>Title</Cell>}
                    cell={props => (<TableCell {...props} content={rows[props.rowIndex][entryTitleRowIndex]} />)}
                    width={150}
                    fixed={shouldColumnFixed}
                />
                <Column
                    header={<Cell>Created At</Cell>}
                    cell={props => (<TableCell {...props} content={rows[props.rowIndex][entryCreatedAtRowIndex]} />)}
                    width={150}
                    fixed={shouldColumnFixed}
                />

                {/* render dynamic columns, starting at index 4 as we rendered the static columns already*/}
                {headers.map((header, index) => {
                    //       console.log(rows);
                    return (
                        <Column
                            key={index}
                            header={<Cell>{renderHeader(header.question)}</Cell>}
                            columnKey={header.inputRef}//to pass down column header
                            cell={props => (
                                /*render rows for dynamic columns, bit weird but fixedDataTable works this way*/
                                /*TableCell will return a cell component based on the type of data to display*/
                                <TableCell
                                    {...props}
                                    title={rows[props.rowIndex][entryTitleRowIndex].answer}//pass title in to reference it later
                                    content={rows[props.rowIndex][index + tableTotalFixedHeaders]}
                                    entryExtra={rows[props.rowIndex][index + tableTotalFixedHeaders]}
                                />
                            )}
                            width={200}
                            allowCellsRecycling
                        />
                    );
                })}
            </FixedDataTable>
        );
    }
}

Table.propTypes = {
    containerWidth: React.PropTypes.number,
    containerHeight: React.PropTypes.number,
    rows: React.PropTypes.array,
    headers: React.PropTypes.array,
    isBranchTable: React.PropTypes.bool,
    isFetchingPage: React.PropTypes.bool,
    projectUser: React.PropTypes.object,
    hierarchyNavigator: React.PropTypes.array,
    forms: React.PropTypes.array
};

//get app state and map to props
const mapStateToProps = (state) => {
    return {
        rows: state.tableReducer.rows,
        headers: state.tableReducer.headers,
        isBranchTable: state.tableReducer.isBranchTable,
        isFetchingPage: state.tableReducer.isFetchingPage,
        projectUser: state.projectReducer.projectUser,
        currentFormRef: state.navigationReducer.currentFormRef,
        forms: state.projectReducer.projectDefinition.project.forms,
        hierarchyNavigator: state.navigationReducer.hierarchyNavigator
    };
};

const mapDispatchToProps = (dispatch) => {
    return bindActionCreators({}, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(Table);
