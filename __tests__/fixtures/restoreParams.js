import PARAMETERS from 'config/parameters';
import { FORM_REF } from './projectExtra';

const isPlainObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

//plain objects are merged recursively, arrays are replaced
const deepMerge = (base, override) => {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override === undefined ? base : override;
    }
    const merged = { ...base };
    Object.keys(override).forEach((key) => {
        merged[key] = deepMerge(base[key], override[key]);
    });
    return merged;
};

const SELF_LINK = 'https://five.epicollect.net/api/internal/entries/project?form_ref=' + FORM_REF;

//the shouldRestoreParams shape actions/index.js reads when restoring
//a previous state (after an add/edit entry, or on a page reload)
const getRestoreParams = (overrides) => {
    const base = {
        links: {
            self: SELF_LINK
        },
        formRef: FORM_REF,
        parentFormRef: null,
        branchRef: null,
        formName: 'Form 1',
        hierarchyNavigator: [
            {
                formRef: FORM_REF,
                formName: 'Form 1',
                selfLink: SELF_LINK
            }
        ],
        entriesFilters: {
            filterByTitle: '',
            startDate: '',
            endDate: '',
            selectedOrderBy: PARAMETERS.ORDER_BY.NEWEST,
            sortBy: PARAMETERS.DEFAULT_ORDERING_COLUMN,
            sortOrder: PARAMETERS.DEFAULT_ORDERING
        },
        activePage: PARAMETERS.PAGE_TABLE,
        selectedLocationQuestion: null,
        branchBackLink: null,
        currentBranchOwnerEntryTitle: null,
        entryUuid: null,
        isViewingChildren: false,
        isViewingBranch: false
    };
    return deepMerge(base, overrides || {});
};

export {
    SELF_LINK,
    getRestoreParams
};
