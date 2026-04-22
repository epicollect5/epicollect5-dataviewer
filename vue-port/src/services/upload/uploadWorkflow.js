import Papa from 'papaparse';
import PARAMETERS from '@/core/config/parameters';
import reverseEntryParser from '@/core/entries/reverseEntryParser';
import helpers from '@/utils/helpers';
import { fetchUploadHeaders, uploadEntryWithResult } from '@/services/api/uploadApi';

const trimParsedRows = (rows = []) => {
  return rows.slice(0, PARAMETERS.TABLE_UPLOAD_MAX_ROWS).map((row) => {
    const trimmed = {};

    Object.entries(row).forEach(([key, value]) => {
      trimmed[key.trim()] = typeof value === 'string' ? value.trim() : value;
    });

    return trimmed;
  });
};

const getParentFormUploadContext = (navigationStore, currentFormRef) => {
  if (navigationStore.hierarchyNavigator.length > 1) {
    return helpers.getParentFormForUpload(navigationStore.hierarchyNavigator, currentFormRef);
  }

  return {
    parentFormRef: null,
    parentEntryUuid: null
  };
};

export const prepareUploadFile = async ({
  file,
  activeMapping,
  projectSlug,
  projectExtra,
  projectDefinition,
  projectMapping,
  projectStats,
  currentFormRef,
  navigationStore
}) => {
  if (!file) {
    return {
      success: false,
      parsingError: '',
      data: null
    };
  }

  if (!file.name.endsWith(`.${PARAMETERS.FORMAT_CSV}`)) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_UPLOAD_ERROR,
      data: null
    };
  }

  if (file.size > PARAMETERS.BULK_MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_SIZE_ERROR,
      data: null
    };
  }

  if (!activeMapping || !projectDefinition.project || !projectMapping?.length) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_UPLOAD_ERROR,
      data: null
    };
  }

  const content = await file.text();
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_UPLOAD_ERROR,
      data: null
    };
  }

  const rows = trimParsedRows(parsed.data);

  if (rows.length === 0) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_UPLOAD_ERROR_NO_ROWS,
      data: null
    };
  }

  const forms = projectDefinition.project.forms;
  const formIndex = helpers.getFormIndexFromRef(forms, currentFormRef);
  const currentFormMapping = activeMapping.forms[currentFormRef];
  const reverseMapping = reverseEntryParser.getReverseMapping(
    currentFormRef,
    currentFormMapping,
    projectExtra,
    projectDefinition,
    null
  );

  const headersResponse = await fetchUploadHeaders(projectSlug, {
    map_index: activeMapping.map_index,
    form_index: formIndex,
    branch_ref: '',
    format: 'json'
  });

  const bulkUploadableHeaders = headersResponse.data.data.headers;
  const parsedHeaders = parsed.meta.fields.map((header) => header.trim());

  if (!bulkUploadableHeaders.every((header) => parsedHeaders.includes(header))) {
    return {
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_MAPPING_ERROR,
      data: null
    };
  }

  const branches = Object.keys(projectExtra.forms[currentFormRef].branch || {});
  const reverseAnswers = reverseEntryParser.getReverseAnswers(
    rows,
    reverseMapping,
    branches,
    null,
    projectExtra.inputs
  );
  const groupRefs = projectExtra.forms[currentFormRef].group || {};

  Object.keys(groupRefs).forEach((groupInputRef) => {
    reverseAnswers.forEach((reverseAnswer) => {
      reverseAnswer.answer[groupInputRef] = {
        answer: '',
        was_jumped: false
      };
    });
  });

  const parentFormForUpload = getParentFormUploadContext(navigationStore, currentFormRef);
  const generatedUuids = [];
  const entries = reverseAnswers.map((reverseAnswer) => {
    let uuid = reverseAnswer.uuid;

    if (!uuid) {
      uuid = helpers.generateUuid();
      generatedUuids.push(uuid);
    }

    return reverseEntryParser.getEntry({
      currentBranchRef: null,
      uuid,
      currentFormRef,
      entryTitle: reverseAnswer.title,
      reverseAnswer,
      projectVersion: projectStats.structure_last_updated,
      parentEntryUuid: parentFormForUpload.parentEntryUuid,
      parentFormRef: parentFormForUpload.parentFormRef,
      currentBranchOwnerUuid: null
    });
  });

  return {
    success: true,
    parsingError: '',
    data: {
      uploadedRows: rows,
      bulkUploadableHeaders,
      reverseEntries: entries,
      reverseMapping,
      generatedUuids
    }
  };
};

export const uploadPreparedEntries = async ({ projectSlug, reverseEntries }) => {
  const uploadResults = [];
  const failedReverseEntries = [];

  for (let index = 0; index < reverseEntries.length; index += 1) {
    const entry = reverseEntries[index];
    const result = await uploadEntryWithResult(projectSlug, entry);

    uploadResults.push(result);

    if (result.status === 'error') {
      failedReverseEntries.push(entry);
    }
  }

  return {
    uploadResults,
    failedReverseEntries
  };
};
