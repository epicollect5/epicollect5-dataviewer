import moment from 'moment';
import PARAMETERS from '@/core/config/parameters';

const stringifyQuery = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    searchParams.set(key, value);
  });

  return searchParams.toString();
};

const parseQuery = (query) => {
  const params = new URLSearchParams(query);
  const parsed = {};

  params.forEach((value, key) => {
    parsed[key] = value;
  });

  return parsed;
};

const helpers = {
  isOdd(num) {
    return num % 2 === 1;
  },

  getDefaultMapping(mappings) {
    let activeMapping = false;

    Object.values(mappings).forEach((mapping) => {
      if (mapping.is_default) {
        activeMapping = mapping;
      }
    });

    return activeMapping;
  },

  getNextForm(forms, currentFormRef) {
    let nextForm = false;

    forms.forEach((form, index) => {
      if (currentFormRef === form.ref && index !== forms.length - 1) {
        nextForm = forms[index + 1];
      }
    });

    return nextForm;
  },

  getPrevForm(forms, currentFormRef) {
    let prevForm = false;

    forms.forEach((form, index) => {
      if (currentFormRef === form.ref && index !== 0) {
        prevForm = forms[index - 1];
      }
    });

    return prevForm;
  },

  textTruncate(str, length, ending) {
    const truncateLength = length == null ? PARAMETERS.MAX_TITLE_LENGHT : length;
    const truncateEnding = ending == null ? '...' : ending;

    if (str.length > truncateLength) {
      return str.substring(0, truncateLength - truncateEnding.length) + truncateEnding;
    }

    return str;
  },

  getXsrfToken(cookieSource) {
    const source =
      typeof cookieSource === 'string'
        ? cookieSource
        : typeof document !== 'undefined'
          ? document.cookie
          : '';

    const cookies = source.split(';');
    let token = '';

    for (let index = 0; index < cookies.length; index += 1) {
      const cookie = cookies[index].split('=');
      if (cookie[0].trim() === 'XSRF-TOKEN') {
        token = decodeURIComponent(cookie[1]);
      }
    }

    return token;
  },

  removeItem(list, index) {
    return [...list.slice(0, index), ...list.slice(index + 1)];
  },

  getParameterByName(name, url) {
    let inputUrl = url;

    if (!inputUrl) {
      inputUrl = typeof window !== 'undefined' ? window.location.href : '';
    }

    const escapedName = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${escapedName}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(inputUrl);

    if (!results) {
      return null;
    }
    if (!results[2]) {
      return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  },

  getFormName(forms, currentFormRef) {
    for (let index = 0; index < forms.length; index += 1) {
      if (forms[index].ref === currentFormRef) {
        return forms[index].name;
      }
    }

    return false;
  },

  getQueryString(url) {
    const urlParts = url.split('?', 1);
    return urlParts[urlParts.length - 1];
  },

  getTimeframeParams(activeTimeframe, currentState) {
    const params = {
      filter_by: 'created_at'
    };

    switch (activeTimeframe) {
      case PARAMETERS.TIMEFRAME.TODAY:
        params.filter_from = moment().format('YYYY-MM-DD');
        break;
      case PARAMETERS.TIMEFRAME.LAST_7_DAYS:
        params.filter_from = moment().subtract(7, 'd').format('YYYY-MM-DD');
        break;
      case PARAMETERS.TIMEFRAME.LAST_30_DAYS:
        params.filter_from = moment().subtract(30, 'd').format('YYYY-MM-DD');
        break;
      case PARAMETERS.TIMEFRAME.YEAR:
        params.filter_from = `${moment().year()}-01-01`;
        break;
      case PARAMETERS.TIMEFRAME.CUSTOM:
        params.filter_from = moment(currentState.selectedStartDate).format('YYYY-MM-DD');
        params.filter_to = moment(currentState.selectedEndDate).format('YYYY-MM-DD');
        break;
      case PARAMETERS.TIMEFRAME.LIFETIME:
      default:
    }

    return params;
  },

  getUploadTemplateEndpoint(params) {
    const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_UPLOAD_TEMPLATE_ENDPOINT;
    const queryParams = {
      map_index: params.mapIndex,
      form_index: params.formIndex,
      branch_ref: params.currentBranchRef || '',
      format: params.format
    };
    const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;

    queryParams[requestCookie] = params.requestTimestamp;
    queryParams.filename = params.filename;

    return `${endpoint}${params.projectSlug}?${stringifyQuery(queryParams)}`;
  },

  getUploadHeadersEndpoint(params) {
    const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_UPLOAD_HEADERS_ENDPOINT;
    const queryParams = {
      map_index: params.mapIndex,
      form_index: params.formIndex,
      branch_ref: params.currentBranchRef || '',
      format: params.format
    };

    return `${endpoint}${params.projectSlug}?${stringifyQuery(queryParams)}`;
  },

  getDownloadSubsetEndpoint(params) {
    const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_DOWNLOAD_SUBSET_ENDPOINT;
    const selfLink = params.hierarchyNavigator[params.hierarchyNavigator.length - 1].selfLink;
    const selfLinkQuery = selfLink.split('?')[1];
    const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
    const queryParams = parseQuery(selfLinkQuery);

    queryParams.format = PARAMETERS.FORMAT_CSV;
    queryParams.filter_by = 'created_at';
    queryParams.sort_order = params.filterSortOrder;
    queryParams.title = params.filterByTitle;
    queryParams.filter_from = params.filterStartDate;
    queryParams.filter_to = params.filterEndDate;
    queryParams[requestCookie] = params.requestTimestamp;
    queryParams.filename = params.filename;
    queryParams.branch_ref = params.currentBranchRef || '';
    queryParams.branch_owner_uuid = params.currentBranchOwnerUuid || '';

    return `${endpoint}${params.projectSlug}?${stringifyQuery(queryParams)}`;
  },

  getFormIndexFromRef(forms, formRef) {
    let index = 0;

    forms.forEach((form, formIndex) => {
      if (form.ref === formRef) {
        index = formIndex;
      }
    });

    return index;
  },

  getBranchInputIndexFromRef(inputs, branchInputRef) {
    let index = 0;

    inputs.forEach((input, inputIndex) => {
      if (input.ref === branchInputRef) {
        index = inputIndex;
      }
    });

    return index;
  },

  generateUuid() {
    let seed = new Date().getTime();

    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      seed += performance.now();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (seed + Math.random() * 16) % 16 | 0;
      seed = Math.floor(seed / 16);
      return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16);
    });
  },

  getParentFormForUpload(forms, currentFormRef) {
    for (let index = 0; index < forms.length; index += 1) {
      if (forms[index].formRef === currentFormRef) {
        if (index !== forms.length) {
          return {
            parentFormRef: forms[index - 1].formRef,
            parentEntryUuid: forms[index].parentEntryUuid
          };
        }
      }
    }

    return false;
  },

  doesAnswerMatchAJump(input, jump, answer, condition) {
    let doesMatch = false;
    const inputTypesWithAnswerArray = [
      PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE,
      PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE,
      PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE
    ];

    if (inputTypesWithAnswerArray.includes(input.type)) {
      if (condition === 'IS' && answer.includes(jump.answer_ref)) {
        doesMatch = true;
      }
      if (condition === 'IS_NOT' && !answer.includes(jump.answer_ref)) {
        doesMatch = true;
      }
    } else {
      if (condition === 'IS' && jump.answer_ref === answer) {
        doesMatch = true;
      }
      if (condition === 'IS_NOT' && jump.answer_ref !== answer) {
        doesMatch = true;
      }
    }

    return doesMatch;
  }
};

export default helpers;
