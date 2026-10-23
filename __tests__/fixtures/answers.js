//Per-type answer values, keyed by input ref.
//The shape of a raw answer is the one the API returns: { answer, was_jumped }.

const ANSWER_VALUES = {
    'text-ref': 'a text answer',
    'textarea-ref': 'a textarea answer',
    'location-ref': { latitude: 45.463822, longitude: 9.190268, accuracy: 12 },
    'branch-ref': '',
    'date-ref': '2018-02-24T17:59:29.179Z',
    'time-ref': '2018-02-24T17:59:29.179Z',
    'audio-ref': 'audio-file.mp3',
    'video-ref': 'video-file.mp4',
    'photo-ref': 'photo-file.jpg',
    'radio-ref': 'radio-ref-a',
    'dropdown-ref': 'dropdown-ref-a',
    'checkbox-ref': ['checkbox-ref-a', 'checkbox-ref-b'],
    'searchsingle-ref': ['searchsingle-ref-a'],
    'searchmultiple-ref': ['searchmultiple-ref-a', 'searchmultiple-ref-b'],
    'dataset-single-ref': ['dataset-ref-a'],
    'dataset-multiple-ref': ['dataset-ref-b', 'dataset-ref-c'],
    'group-text-ref': 'a group text answer',
    'branch-text-ref': 'a branch text answer',
    'branch-radio-ref': 'branch-radio-ref-a'
};

//refs that are never answered: readme inputs never get an answer, and a group
//input gets none of its own (its members carry the answers)
const UNANSWERED_REFS = [
    'readme-ref',
    'group-ref',
    'group-readme-ref',
    'group2-ref',
    'group2-text-ref',
    'group2-readme-ref'
];

const getRawAnswer = (ref, overrides) => {
    return {
        answer: ANSWER_VALUES[ref],
        was_jumped: false,
        ...(overrides || {})
    };
};

const getRawAnswers = (refs) => {
    const answers = {};
    refs.forEach((ref) => {
        answers[ref] = getRawAnswer(ref);
    });
    return answers;
};

export {
    ANSWER_VALUES,
    UNANSWERED_REFS,
    getRawAnswer,
    getRawAnswers
};
