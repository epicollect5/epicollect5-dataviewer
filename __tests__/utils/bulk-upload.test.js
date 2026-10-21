import bulkUpload from 'utils/bulk-upload';
import PARAMETERS from 'config/parameters';

const BRANCH_REF = 'branch-ref-1';

const buildInput = (ref, type, datetimeFormat) => {
    return {
        ref,
        type,
        datetime_format: datetimeFormat || null
    };
};

const buildCurrentEntry = (answers) => {
    return {
        data: {
            entry: { answers },
            branch_entry: { answers }
        }
    };
};

const buildEntryMapping = (possibleAnswers) => {
    return {
        possible_answers: possibleAnswers
    };
};

const possibleAnswers = {
    'radio-ref-a': { map_to: 'Radio A' },
    'dropdown-ref-a': { map_to: 'Dropdown A' },
    'checkbox-ref-a': { map_to: 'Checkbox A' },
    'checkbox-ref-b': { map_to: 'Checkbox B' }
};

describe('bulk upload utils test', () => {

    describe('getFailedOriginalAnswer', () => {

        it('should re-format a date answer', () => {
            const input = buildInput('date-ref', PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE, PARAMETERS.DATE_FORMAT_1);
            const currentEntry = buildCurrentEntry({
                'date-ref': { answer: '2018-02-24T17:59:29.179Z' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('24/02/2018');
        });

        it('should re-format a time answer', () => {
            const input = buildInput('time-ref', PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE, PARAMETERS.TIME_FORMAT_1);
            const currentEntry = buildCurrentEntry({
                'time-ref': { answer: '2018-02-24T17:59:29.179Z' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('17:59:29');
        });

        it('should map a radio answer ref back to its value', () => {
            const input = buildInput('radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE);
            const currentEntry = buildCurrentEntry({
                'radio-ref': { answer: 'radio-ref-a' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('Radio A');
        });

        it('should map a dropdown answer ref back to its value', () => {
            const input = buildInput('dropdown-ref', PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE);
            const currentEntry = buildCurrentEntry({
                'dropdown-ref': { answer: 'dropdown-ref-a' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('Dropdown A');
        });

        it('should return the raw answer ref when it is not a known one', () => {
            const input = buildInput('radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE);
            const currentEntry = buildCurrentEntry({
                'radio-ref': { answer: 'an-unknown-ref' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('an-unknown-ref');
        });

        it('should return an empty answer when a single answer is empty', () => {
            const input = buildInput('radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE);
            const currentEntry = buildCurrentEntry({
                'radio-ref': { answer: '' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('');
        });

        it('should map the checkbox answer refs back to their values', () => {
            const input = buildInput('checkbox-ref', PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE);
            const currentEntry = buildCurrentEntry({
                'checkbox-ref': { answer: ['checkbox-ref-a', 'checkbox-ref-b'] }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('Checkbox A, Checkbox B');
        });

        it('should map the search answer refs back to their values', () => {
            const input = buildInput('searchsingle-ref', PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE);
            const currentEntry = buildCurrentEntry({
                'searchsingle-ref': { answer: ['checkbox-ref-a'] }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('Checkbox A');
        });

        it('should unwrap a wrong answer ref wrapped in dashes', () => {
            const input = buildInput('checkbox-ref', PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE);
            const currentEntry = buildCurrentEntry({
                'checkbox-ref': { answer: ['-a-wrong-value-'] }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('a-wrong-value');
        });

        it('should return an empty answer when an array answer is empty', () => {
            const input = buildInput('checkbox-ref', PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE);
            const currentEntry = buildCurrentEntry({
                'checkbox-ref': { answer: '' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'entry');

            expect(answer).toBe('');
        });

        it('should read the answers of a branch entry', () => {
            const input = buildInput('radio-ref', PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE);
            const currentEntry = buildCurrentEntry({
                'radio-ref': { answer: 'radio-ref-a' }
            });

            const answer = bulkUpload.getFailedOriginalAnswer(input, buildEntryMapping(possibleAnswers), currentEntry, 'branch_entry');

            expect(answer).toBe('Radio A');
        });
    });
});
