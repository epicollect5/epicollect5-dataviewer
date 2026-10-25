import PARAMETERS from '@/core/config/parameters';

//a branch table has no children column, as legacy splices it out of the fixed headers
const getFixedCellsTotal = (isBranchTable = false) => {
  return isBranchTable
    ? PARAMETERS.TABLE_FIXED_HEADERS_TOTAL - 1
    : PARAMETERS.TABLE_FIXED_HEADERS_TOTAL;
};

export const mapTableRowsToGrid = (rows = [], isBranchTable = false) => {
  const fixedCellsTotal = getFixedCellsTotal(isBranchTable);

  return rows.map((row) => {
    const cells = row.cells;
    const gridRow = {
      id: row.id,
      view: 'View',
      delete: 'Delete',
      edit: 'Edit',
      children: isBranchTable ? null : cells[PARAMETERS.TABLE_FIXED_HEADERS_CHILDREN_INDEX]?.answer ?? 0,
      title: cells[fixedCellsTotal - 2]?.answer ?? '',
      createdAt: cells[fixedCellsTotal - 1]?.answer ?? ''
    };
    gridRow.__cells = cells;
    gridRow.__fixedCellsTotal = fixedCellsTotal;

    for (let index = fixedCellsTotal; index < cells.length; index += 1) {
      gridRow[`answer_${index - fixedCellsTotal}`] = cells[index]?.answer ?? '';
    }

    return gridRow;
  });
};
