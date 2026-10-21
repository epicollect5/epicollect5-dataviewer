import { getRawAnswers } from './answers';

//the refs that carry an answer in a regular (non branch) entry
const ANSWERED_REFS = [
    'text-ref',
    'textarea-ref',
    'location-ref',
    'branch-ref',
    'date-ref',
    'time-ref',
    'audio-ref',
    'video-ref',
    'photo-ref',
    'radio-ref',
    'dropdown-ref',
    'checkbox-ref',
    'searchsingle-ref',
    'searchmultiple-ref',
    'dataset-single-ref',
    'dataset-multiple-ref',
    'group-text-ref'
];

//the refs that carry an answer in a branch entry
const BRANCH_ANSWERED_REFS = [
    'branch-text-ref',
    'branch-radio-ref'
];

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

//a single entry row, as the entries endpoint returns it
const getEntry = (overrides) => {
    const base = {
        entry: {
            entry_uuid: 'entry-uuid-1',
            title: 'Entry title 1',
            created_at: '2018-02-24T17:59:29.179Z',
            uploaded_at: '2018-02-24T17:59:29.179Z',
            answers: getRawAnswers(ANSWERED_REFS)
        },
        attributes: {
            child_counts: 2,
            branch_counts: {
                'branch-ref': 3
            }
        },
        relationships: {}
    };
    return deepMerge(base, overrides || {});
};

//the branch payload of an entry row
const getBranchEntry = (overrides) => {
    const base = {
        entry_uuid: 'branch-entry-uuid-1',
        title: 'Branch entry title 1',
        created_at: '2018-02-24T17:59:29.179Z',
        uploaded_at: '2018-02-24T17:59:29.179Z',
        answers: getRawAnswers(BRANCH_ANSWERED_REFS)
    };
    return deepMerge(base, overrides || {});
};

//the payload shape utils/table.getRows expects
const getEntriesPayload = (entries) => {
    return {
        data: {
            entries: entries || [getEntry()]
        }
    };
};

export {
    ANSWERED_REFS,
    BRANCH_ANSWERED_REFS,
    getEntry,
    getBranchEntry,
    getEntriesPayload
};
