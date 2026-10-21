import PARAMETERS from 'config/parameters';

const FORM_REF = 'form-ref-1';
const BRANCH_REF = 'branch-ref-1';
const SECOND_FORM_REF = 'form-ref-2';

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

const buildInput = (ref, type, question, datetimeFormat) => {
    return {
        data: {
            ref,
            type,
            question,
            datetime_format: datetimeFormat || null
        }
    };
};

const buildInputs = () => {
    return {
        'text-ref': buildInput('text-ref', PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE, 'Text question'),
        'textarea-ref': buildInput('textarea-ref', PARAMETERS.INPUT_TYPES.EC5_TEXTAREA_TYPE, 'Textarea question'),
        'location-ref': buildInput('location-ref', PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE, 'Location question'),
        'branch-ref': buildInput('branch-ref', PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE, 'Branch question'),
        'date-ref': buildInput('date-ref', PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE, 'Date question', PARAMETERS.DATE_FORMAT_1),
        'time-ref': buildInput('time-ref', PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE, 'Time question', PARAMETERS.TIME_FORMAT_1),
        'audio-ref': buildInput('audio-ref', PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE, 'Audio question'),
        'video-ref': buildInput('video-ref', PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE, 'Video question'),
        'photo-ref': buildInput('photo-ref', PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE, 'Photo question'),
        'radio-ref': buildInput('radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE, 'Radio question'),
        'dropdown-ref': buildInput('dropdown-ref', PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE, 'Dropdown question'),
        'checkbox-ref': buildInput('checkbox-ref', PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE, 'Checkbox question'),
        'searchsingle-ref': buildInput('searchsingle-ref', PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE, 'Search single question'),
        'searchmultiple-ref': buildInput('searchmultiple-ref', PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE, 'Search multiple question'),
        'dataset-single-ref': buildInput('dataset-single-ref', PARAMETERS.INPUT_TYPES.EC5_DATASET_SINGLE_TYPE, 'Dataset single question'),
        'dataset-multiple-ref': buildInput('dataset-multiple-ref', PARAMETERS.INPUT_TYPES.EC5_DATASET_MULTIPLE_TYPE, 'Dataset multiple question'),
        'group-ref': buildInput('group-ref', PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE, 'Group question'),
        'readme-ref': buildInput('readme-ref', PARAMETERS.INPUT_TYPES.EC5_README_TYPE, 'Readme question'),
        'group-text-ref': buildInput('group-text-ref', PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE, 'Group text question'),
        'group-readme-ref': buildInput('group-readme-ref', PARAMETERS.INPUT_TYPES.EC5_README_TYPE, 'Group readme question'),
        'group2-ref': buildInput('group2-ref', PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE, 'Second group question'),
        'group2-text-ref': buildInput('group2-text-ref', PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE, 'Second group text question'),
        'group2-readme-ref': buildInput('group2-readme-ref', PARAMETERS.INPUT_TYPES.EC5_README_TYPE, 'Second group readme question'),
        'branch-text-ref': buildInput('branch-text-ref', PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE, 'Branch text question'),
        'branch-radio-ref': buildInput('branch-radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE, 'Branch radio question')
    };
};

const buildForms = () => {
    return {
        [FORM_REF]: {
            inputs: [
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
                'group-ref',
                'readme-ref',
                'group2-ref'
            ],
            group: {
                'group-ref': ['group-text-ref', 'group-readme-ref'],
                'group2-ref': ['group2-text-ref', 'group2-readme-ref']
            },
            branch: {
                [BRANCH_REF]: ['branch-text-ref', 'branch-radio-ref']
            },
            details: {
                has_location: true
            },
            lists: {
                multiple_choice_inputs: {
                    form: {
                        'radio-ref': {
                            possible_answers: {
                                'radio-ref-a': 'Radio A',
                                'radio-ref-b': 'Radio B'
                            }
                        },
                        'dropdown-ref': {
                            possible_answers: {
                                'dropdown-ref-a': 'Dropdown A'
                            }
                        },
                        'checkbox-ref': {
                            possible_answers: {
                                'checkbox-ref-a': 'Checkbox A',
                                'checkbox-ref-b': 'Checkbox B'
                            }
                        },
                        'searchsingle-ref': {
                            possible_answers: {
                                'searchsingle-ref-a': 'Search Single A'
                            }
                        },
                        'searchmultiple-ref': {
                            possible_answers: {
                                'searchmultiple-ref-a': 'Search Multiple A',
                                'searchmultiple-ref-b': 'Search Multiple B'
                            }
                        }
                    },
                    branch: {
                        [BRANCH_REF]: {
                            'branch-radio-ref': {
                                possible_answers: {
                                    'branch-radio-ref-a': 'Branch Radio A'
                                }
                            }
                        }
                    }
                },
                location_inputs: [
                    { input_ref: 'location-ref', branch_ref: null }
                ]
            }
        },
        [SECOND_FORM_REF]: {
            inputs: [],
            group: {},
            branch: {},
            details: {
                has_location: false
            },
            lists: {
                multiple_choice_inputs: {
                    form: {},
                    branch: {}
                },
                location_inputs: []
            }
        }
    };
};

//the projectExtra shape the utils consume
const getProjectExtra = (overrides) => {
    const base = {
        inputs: buildInputs(),
        forms: buildForms()
    };
    return deepMerge(base, overrides || {});
};

export {
    FORM_REF,
    BRANCH_REF,
    SECOND_FORM_REF,
    getProjectExtra,
    deepMerge
};
