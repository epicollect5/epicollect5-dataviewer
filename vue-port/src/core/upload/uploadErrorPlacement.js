const GENERAL_ERROR_MATCHERS = [
  { source: 'upload-controller', code: 'ec5_201' },
  { source: 'json-contains-html', code: 'ec5_220' },
  { source: 'upload-controller', code: 'ec5_202' },
  { source: 'upload', code: 'ec5_54' },
  { source: 'entry.entry_uuid', code: 'ec5_28' },
  { source: 'id', code: 'ec5_28' },
  { source: 'upload', code: 'ec5_358' },
  { source: 'upload', code: 'ec5_359' },
  { source: 'bulk-upload', code: 'ec5_363' },
  { source: 'middleware', code: 'ec5_360' },
  { source: 'upload-controller', code: 'ec5_71' },
  { source: 'rate-limiter', code: 'ec5_255' }
];

const findGeneralError = (errors = []) => {
  return errors.find((error) => {
    return GENERAL_ERROR_MATCHERS.some((matcher) => {
      return error.source === matcher.source && error.code === matcher.code;
    });
  });
};

export const getErrorMessageForColumn = ({ errors = [], columnKey, columnIndex, reverseMapping }) => {
  const mapping = reverseMapping?.reverse?.[columnKey];

  if (mapping?.input_ref) {
    const directError = errors.find((error) => error.source === mapping.input_ref);
    if (directError) {
      return directError.title;
    }
  }

  if (columnIndex === 0) {
    return findGeneralError(errors)?.title || '';
  }

  return '';
};
