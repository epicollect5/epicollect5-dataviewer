export const buildUploadRowPairs = ({
  uploadedRows = [],
  reverseEntries = [],
  responses = [],
  reverseMapping,
  generatedUuids = [],
  filterByFailed = false
}) => {
  const pairs = [];

  responses.forEach((response, index) => {
    const uploadedRow = uploadedRows[index] || {};
    const reverseEntry = reverseEntries[index] || null;
    const entryType = reverseEntry?.data?.type === 'branch_entry' ? 'branch_entry' : 'entry';
    const entryUuid = reverseEntry?.data?.[entryType]?.entry_uuid || '';
    const displayUuid = generatedUuids.includes(entryUuid) ? '' : entryUuid;
    const hasErrors = Array.isArray(response.errors) && response.errors.length > 0;

    if (filterByFailed && !hasErrors) {
      return;
    }

    pairs.push({
      id: `upload-data-${index}`,
      pairId: `pair-${index}`,
      rowType: 'data',
      uploadIndex: index,
      entryUuid: displayUuid,
      uploadedRow,
      response,
      reverseMapping
    });

    if (hasErrors) {
      pairs.push({
        id: `upload-error-${index}`,
        pairId: `pair-${index}`,
        rowType: 'error',
        uploadIndex: index,
        uploadedRow,
        response,
        reverseMapping
      });
    }
  });

  return pairs;
};
