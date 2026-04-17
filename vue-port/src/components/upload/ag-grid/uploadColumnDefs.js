import { getErrorMessageForColumn } from '@/core/upload/uploadErrorPlacement';

const createStatusRenderer = () => (params) => {
  if (params.data.rowType === 'error') {
    return '';
  }

  return params.data.response.status === 'success' ? 'Done' : 'Warning';
};

const createValueRenderer = (columnKey, columnIndex) => (params) => {
  if (params.data.rowType === 'error') {
    return getErrorMessageForColumn({
      errors: params.data.response.errors,
      columnKey,
      columnIndex,
      reverseMapping: params.data.reverseMapping
    });
  }

  return params.data.uploadedRow[columnKey] ?? '';
};

export const createUploadColumnDefs = (headers = []) => {
  const columns = [
    {
      headerName: 'Status',
      field: '__status',
      pinned: 'left',
      width: 110,
      minWidth: 110,
      sortable: false,
      resizable: false,
      cellRenderer: createStatusRenderer()
    },
    {
      headerName: 'UUID',
      field: '__uuid',
      pinned: 'left',
      width: 180,
      minWidth: 160,
      sortable: false,
      cellRenderer: (params) => (params.data.rowType === 'error' ? '' : params.data.entryUuid)
    }
  ];

  headers.forEach((header, index) => {
    columns.push({
      headerName: header,
      field: header,
      minWidth: 180,
      width: 180,
      sortable: false,
      cellRenderer: createValueRenderer(header, index)
    });
  });

  return columns;
};
