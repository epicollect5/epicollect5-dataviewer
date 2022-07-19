import PARAMETERS from 'config/parameters';
import ObjectValuesPolyfill from 'object.values';
import moment from 'moment';
import merge from 'lodash/merge';
import queryString from 'query-string';

const helpers = {

    isOdd(num) {
        return num % 2 === 1;
    },

    getDefaultMapping(mappings) {
        const iterator = Object.values || ObjectValuesPolyfill;
        let activeMapping = false;

        iterator(mappings).forEach((mapping) => {
            if (mapping.is_default) {
                activeMapping = mapping;
            }
        });
        return activeMapping;
    },

    //get next form in the hierarchy
    getNextForm(forms, currentFormRef) {
        let nextForm = false;
        forms.forEach((form, index) => {
            if (currentFormRef === form.ref) {
                if (index !== forms.length - 1) {
                    nextForm = forms[index + 1];
                    return false;
                }
            }
        });
        return nextForm;
    },

    //get previous form in the hierarchy
    getPrevForm(forms, currentFormRef) {
        let prevForm = false;
        forms.forEach((form, index) => {
            if (currentFormRef === form.ref) {
                if (index !== 0) {
                    prevForm = forms[index - 1];
                    return false;
                }
            }
        });
        return prevForm;
    },

    textTruncate(str, length, ending) {
        if (length == null) {
            length = PARAMETERS.MAX_TITLE_LENGHT;
        }
        if (ending == null) {
            ending = '...';
        }
        if (str.length > length) {
            return str.substring(0, length - ending.length) + ending;
        }
        return str;

    },

    getXsrfToken() {

        const cookies = document.cookie.split(';');
        let token = '';

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].split('=');
            if (cookie[0].trim() === 'XSRF-TOKEN') {
                token = decodeURIComponent(cookie[1]);
            }
        }
        return token;
    },
    removeItem(list, index) {
        return [
            ...list.slice(0, index),
            ...list.slice(index + 1)
        ];
    },
    getParameterByName(name, url) {
        if (!url) {
            url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    },
    //todo we can improve but the loop is on 5 elements max....
    getFormName: (forms, currentFormRef) => {
        for (let i = 0, len = forms.length; i < len; i++) {
            if (forms[i].ref === currentFormRef) {
                return forms[i].name;
            }
        }
        //return false when there is not a next formRef
        return false;
    },
    getQueryString(url) {
        const urlParts = url.split('?', 1); //split only on first occurrence
        return urlParts[urlParts.length - 1];
    },

    getTimeframeParams(activeTimeframe, currentState) {

        const params = {
            filter_by: 'created_at'
        };

        switch (activeTimeframe) {

            case PARAMETERS.TIMEFRAME.LIFETIME: {
                //do nothing
            }
                break;
            case PARAMETERS.TIMEFRAME.TODAY: {
                //do nothing
                params.filter_from = moment().format('YYYY-MM-DD');

            }
                break;
            case PARAMETERS.TIMEFRAME.LAST_7_DAYS: {
                //do nothing
                params.filter_from = moment().subtract(7, 'd').format('YYYY-MM-DD');
            }
                break;
            case PARAMETERS.TIMEFRAME.LAST_30_DAYS: {
                //do nothing
                params.filter_from = moment().subtract(30, 'd').format('YYYY-MM-DD');
            }
                break;
            case PARAMETERS.TIMEFRAME.YEAR: {
                //do nothing
                params.filter_from = moment().year() + '-01-01';
            }
                break;
            case PARAMETERS.TIMEFRAME.CUSTOM: {
                params.filter_from = moment(currentState.selectedStartDate).format('YYYY-MM-DD');
                params.filter_to = moment(currentState.selectedEndDate).format('YYYY-MM-DD');
            }
                break;
            default:
            //do nothing
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

        const query = '?' + queryString.stringify(merge(queryParams));

        return endpoint + params.projectSlug + query;
    },

    getUploadHeadersEndpoint(params) {

        const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_UPLOAD_HEADERS_ENDPOINT;
        const queryParams = {
            map_index: params.mapIndex,
            form_index: params.formIndex,
            branch_ref: params.currentBranchRef || '',
            format: params.format
        };

        const query = '?' + queryString.stringify(merge(queryParams));

        return endpoint + params.projectSlug + query;
    },

    getDownloadSubsetEndpoint(params) {

        const endpoint = PARAMETERS.SERVER_URL + PARAMETERS.API_DOWNLOAD_SUBSET_ENDPOINT;
        const selfLink = params.hierarchyNavigator[params.hierarchyNavigator.length - 1].selfLink;

        const selfLinkQuery = selfLink.split('?')[1];
        const requestCookie = PARAMETERS.COOKIES.DOWNLOAD_ENTRIES;
        const queryParams = queryString.parse(selfLinkQuery);

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

        const query = '?' + queryString.stringify(queryParams);

        return endpoint + params.projectSlug + query;
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
        //new method to generated uuid, much better -> https://goo.gl/82GDUJ
        let d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            //console.log(performance.now());
            d += performance.now(); //use high-precision timer if available
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    },
    //todo we can improve but the loop is on 5 elements max....
    getParentFormForUpload: (forms, currentFormRef) => {
        for (let i = 0, len = forms.length; i < len; i++) {
            if (forms[i].formRef === currentFormRef) {
                if (i !== len) {
                    return {
                        parentFormRef: forms[i - 1].formRef,
                        parentEntryUuid: forms[i].parentEntryUuid
                    };
                }
            }
        }
        //return false when there is not a next formRef
        return false;
    },

    doesAnswerMatchAJump: (input, jump, answer, condition) => {

        let doesMatch = false;
        const inputTypesWithAnswerArray = [
            PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE,
            PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE
        ];

        if (inputTypesWithAnswerArray.includes(input.type)) {
            //above question types get  array for answers
            if (condition === 'IS') {
                if (answer.includes(jump.answer_ref)) {
                    doesMatch = true;
                }
            }
            if (condition === 'IS_NOT') {
                if (!answer.includes(jump.answer_ref)) {
                    doesMatch = true;
                }
            }
        } else {
            //all other question types are string
            if (condition === 'IS') {
                if (jump.answer_ref === answer) {
                    doesMatch = true;
                }
            }
            if (condition === 'IS_NOT') {
                if (jump.answer_ref !== answer) {
                    doesMatch = true;
                }
            }
        }
        return doesMatch;
    }
};

export default helpers;
