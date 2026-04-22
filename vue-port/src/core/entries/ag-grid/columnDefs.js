export const mapTableRowsToGrid = (rows = []) => {
  return rows.map((row) => {
    const cells = row.cells;
    const gridRow = {
      id: row.id,
      view: 'View',
      delete: 'Delete',
      edit: 'Edit',
      children: cells[3]?.answer ?? 0,
      title: cells[4]?.answer ?? '',
      createdAt: cells[5]?.answer ?? ''
    };
    gridRow.__cells = cells;

    for (let index = 6; index < cells.length; index += 1) {
      gridRow[`answer_${index - 6}`] = cells[index]?.answer ?? '';
    }

    return gridRow;
  });
};
