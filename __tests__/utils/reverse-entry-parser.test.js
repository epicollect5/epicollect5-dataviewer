import reverseEntryParser from 'utils/reverse-entry-parser';
import PARAMETERS from 'config/parameters';

const RealDate = Date;

/**
 * Replace the global Date so that new Date() always returns the given instant.
 * This keeps the UTC date/time maths deterministic regardless of when the tests run.
 */
const mockCurrentDate = (isoString) => {
    const fixedTime = new RealDate(isoString).getTime();

    function MockDate(...args) {
        if (args.length === 0) {
            return new RealDate(fixedTime);
        }
        return new RealDate(...args);
    }

    MockDate.now = () => {
        return fixedTime;
    };
    MockDate.parse = RealDate.parse;
    MockDate.UTC = RealDate.UTC;
    MockDate.prototype = RealDate.prototype;

    global.Date = MockDate;
};

const reverseMappingForTime = (timeFormat) => {
    return {
        ref2MapTo: {
            'time-input-ref': 'Time question'
        },
        reverse: {
            'Time question': {
                input_ref: 'time-input-ref',
                type: PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE,
                datetime_format: timeFormat,
                is_title: false
            }
        }
    };
};

const parseTimeAnswer = (answerValue, timeFormat) => {
    const reverseAnswers = reverseEntryParser.getReverseAnswers(
        [{
            ec5_uuid: '',
            'Time question': answerValue
        }],
        reverseMappingForTime(timeFormat),
        [],
        null,
        {}
    );

    return reverseAnswers[0].answer['time-input-ref'].answer;
};

describe('reverse-entry-parser time question test', () => {

    afterEach(() => {
        global.Date = RealDate;
    });

    it('should use the day of the month, not the day of the week, on a Sunday (UTC)', () => {
        //Sunday 25 October 2026: getUTCDay() would return 0 -> "2026-10-00"
        mockCurrentDate('2026-10-25T20:26:00.000Z');
        expect(parseTimeAnswer('20:26', PARAMETERS.TIME_FORMAT_3)).toBe('2026-10-25T20:26:00.000');
    });

    it('should use the day of the month, not the day of the week, on a Tuesday (UTC)', () => {
        //Tuesday 20 October 2026: getUTCDay() would return 2 -> "2026-10-02"
        mockCurrentDate('2026-10-20T22:00:00.000Z');
        expect(parseTimeAnswer('22:00', PARAMETERS.TIME_FORMAT_3)).toBe('2026-10-20T22:00:00.000');
    });

    it('should zero pad single digit months and days', () => {
        //Sunday 4 January 2026
        mockCurrentDate('2026-01-04T08:05:00.000Z');
        expect(parseTimeAnswer('08:05', PARAMETERS.TIME_FORMAT_3)).toBe('2026-01-04T08:05:00.000');
    });

    it('should build a valid ISO date for every day of the week', () => {
        //2026-10-25 is a Sunday, 2026-10-26 a Monday, and so on
        const daysOfWeek = [25, 26, 27, 28, 29, 30, 31];

        daysOfWeek.forEach((dayOfMonth) => {
            const date = ('0' + dayOfMonth).slice(-2);
            mockCurrentDate('2026-10-' + date + 'T20:26:00.000Z');

            expect(parseTimeAnswer('20:26', PARAMETERS.TIME_FORMAT_3))
                .toBe('2026-10-' + date + 'T20:26:00.000');
        });
    });

    it('should keep the HH:mm:ss time format', () => {
        mockCurrentDate('2026-10-25T20:26:00.000Z');
        expect(parseTimeAnswer('20:26:07', PARAMETERS.TIME_FORMAT_1)).toBe('2026-10-25T20:26:07.000');
    });

    it('should keep the hh:mm:ss time format', () => {
        mockCurrentDate('2026-10-25T08:26:00.000Z');
        expect(parseTimeAnswer('08:26:07', PARAMETERS.TIME_FORMAT_2)).toBe('2026-10-25T08:26:07.000');
    });

    it('should keep the hh:mm time format', () => {
        mockCurrentDate('2026-10-25T08:26:00.000Z');
        expect(parseTimeAnswer('08:26', PARAMETERS.TIME_FORMAT_4)).toBe('2026-10-25T08:26:00.000');
    });

    it('should build the mm:ss time format as hours:minutes:seconds, with 00 hours', () => {
        mockCurrentDate('2026-10-25T20:26:00.000Z');
        expect(parseTimeAnswer('45:07', PARAMETERS.TIME_FORMAT_5)).toBe('2026-10-25T00:45:07.000');
    });

    it('should not swap minutes and seconds in the mm:ss time format', () => {
        mockCurrentDate('2026-10-25T20:26:00.000Z');
        //"59:29" must map to 00:59:29 and not 00:29:59
        expect(parseTimeAnswer('59:29', PARAMETERS.TIME_FORMAT_5)).toBe('2026-10-25T00:59:29.000');
    });

    it('should keep empty answers empty', () => {
        mockCurrentDate('2026-10-25T20:26:00.000Z');
        expect(parseTimeAnswer('', PARAMETERS.TIME_FORMAT_3)).toBe('');
    });

});

const buildInput = (ref, type, jumps, group) => {
    return {
        ref,
        type,
        jumps: jumps || [],
        group: group || []
    };
};

const buildEntry = (answers) => {
    return {
        data: {
            type: 'entry',
            entry: {
                answers
            }
        }
    };
};

const jumpMappingFor = (inputRef, mapTo, when, answerRef, toInputRef) => {
    return {
        ref2MapTo: {
            [inputRef]: mapTo
        },
        reverse: {
            [mapTo]: {
                reverse_jumps: [{
                    toInputRef: toInputRef || 'END',
                    when,
                    answer: null,
                    answer_ref: answerRef
                }]
            }
        }
    };
};

describe('reverse-entry-parser jumped answers test', () => {

    it('should send [] for jumped checkbox and search questions and "" for every other type', () => {
        const answers = {
            source: { answer: 'yes-ref', was_jumped: false },
            checkbox: { answer: ['a'], was_jumped: false },
            searchsingle: { answer: ['b'], was_jumped: false },
            searchmultiple: { answer: ['c'], was_jumped: false },
            radio: { answer: 'r', was_jumped: false },
            dropdown: { answer: 'd', was_jumped: false },
            text: { answer: 'hello', was_jumped: false },
            location: { answer: { latitude: 1, longitude: 2, accuracy: 3 }, was_jumped: false }
        };

        const inputs = [
            buildInput('source', 'dropdown', [{ to: 'END', when: 'IS', answer_ref: 'yes-ref' }]),
            buildInput('checkbox', 'checkbox'),
            buildInput('searchsingle', 'searchsingle'),
            buildInput('searchmultiple', 'searchmultiple'),
            buildInput('radio', 'radio'),
            buildInput('dropdown', 'dropdown'),
            buildInput('text', 'text'),
            buildInput('location', 'location')
        ];

        const entries = reverseEntryParser.setEntryJumps(
            [buildEntry(answers)],
            inputs,
            jumpMappingFor('source', 'Source Q', 'IS', 'yes-ref'),
            null
        );

        const result = entries[0].data.entry.answers;

        expect(result.checkbox.answer).toEqual([]);
        expect(result.searchsingle.answer).toEqual([]);
        expect(result.searchmultiple.answer).toEqual([]);
        expect(result.radio.answer).toBe('');
        expect(result.dropdown.answer).toBe('');
        expect(result.text.answer).toBe('');
        expect(result.location.answer).toBe('');
        expect(result.source.answer).toBe('yes-ref');
        expect(result.text.was_jumped).toBe(true);
        expect(result.source.was_jumped).toBe(false);
    });

    it('should use the jumped question type even when the jumping question is a checkbox', () => {
        const answers = {
            source: { answer: ['a-ref'], was_jumped: false },
            text: { answer: 'hello', was_jumped: false },
            checkbox: { answer: ['b-ref'], was_jumped: false },
            groupChildCheckbox: { answer: ['c-ref'], was_jumped: false },
            groupChildText: { answer: 'group text', was_jumped: false }
        };

        const inputs = [
            buildInput('source', 'checkbox', [{ to: 'END', when: 'IS', answer_ref: 'a-ref' }]),
            buildInput('text', 'text'),
            buildInput('checkbox', 'checkbox'),
            buildInput('group', 'group', [], [
                buildInput('groupChildCheckbox', 'checkbox'),
                buildInput('groupChildText', 'text')
            ])
        ];

        const entries = reverseEntryParser.setEntryJumps(
            [buildEntry(answers)],
            inputs,
            jumpMappingFor('source', 'Source Q', 'IS', 'a-ref'),
            null
        );

        const result = entries[0].data.entry.answers;

        expect(result.text.answer).toBe('');
        expect(result.checkbox.answer).toEqual([]);
        expect(result.groupChildCheckbox.answer).toEqual([]);
        expect(result.groupChildText.answer).toBe('');
        expect(result.source.answer).toEqual(['a-ref']);
    });

});

describe('reverse-entry-parser NO_ANSWER_GIVEN jump test', () => {

    const noAnswerJump = [{ to: 'q3', when: 'NO_ANSWER_GIVEN', answer_ref: null }];

    const buildEntriesWithSource = (sourceType, sourceAnswer, q2Answer) => {
        return [
            buildEntry({
                source: { answer: sourceAnswer, was_jumped: false },
                q2: { answer: q2Answer, was_jumped: false },
                q3: { answer: 'target', was_jumped: false }
            }),
            buildInput('source', sourceType, noAnswerJump),
            buildInput('q2', 'text'),
            buildInput('q3', 'text')
        ];
    };

    it('should not jump when a dropdown has an answer', () => {
        const [entry, ...inputs] = buildEntriesWithSource('dropdown', 'yes-ref', 'keep me');

        const entries = reverseEntryParser.setEntryJumps(
            [entry],
            inputs,
            jumpMappingFor('source', 'Source Q', 'NO_ANSWER_GIVEN', null, 'q3'),
            null
        );

        const result = entries[0].data.entry.answers;

        expect(result.q2.answer).toBe('keep me');
        expect(result.q2.was_jumped).toBe(false);
        expect(result.q3.answer).toBe('target');
    });

    it('should jump when a dropdown has no answer', () => {
        const [entry, ...inputs] = buildEntriesWithSource('dropdown', '', 'keep me');

        const entries = reverseEntryParser.setEntryJumps(
            [entry],
            inputs,
            jumpMappingFor('source', 'Source Q', 'NO_ANSWER_GIVEN', null, 'q3'),
            null
        );

        const result = entries[0].data.entry.answers;

        expect(result.q2.answer).toBe('');
        expect(result.q2.was_jumped).toBe(true);
        expect(result.q3.answer).toBe('target');
        expect(result.q3.was_jumped).toBe(false);
    });

    it('should use the checkbox answers to decide the jump', () => {
        const [answered, ...inputs] = buildEntriesWithSource('checkbox', ['a-ref'], 'keep me');
        const [unanswered] = buildEntriesWithSource('checkbox', [], 'keep me');

        const entries = reverseEntryParser.setEntryJumps(
            [answered, unanswered],
            inputs,
            jumpMappingFor('source', 'Source Q', 'NO_ANSWER_GIVEN', null, 'q3'),
            null
        );

        const answeredResult = entries[0].data.entry.answers;
        const unansweredResult = entries[1].data.entry.answers;

        expect(answeredResult.q2.answer).toBe('keep me');
        expect(answeredResult.q2.was_jumped).toBe(false);
        expect(unansweredResult.q2.answer).toBe('');
        expect(unansweredResult.q2.was_jumped).toBe(true);
    });

});

describe('reverse-entry-parser location jump test', () => {

    it('should reverse map and apply a jump on a location question', () => {
        const formRef = 'form-ref';
        const locationRef = 'q1-location';
        const q2Ref = 'q2-text';
        const q3Ref = 'q3-text';

        const locationInput = {
            ref: locationRef,
            type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE,
            is_title: false,
            datetime_format: null,
            jumps: [{ to: 'END', when: 'ALL', answer_ref: null }]
        };
        const textInput = (ref) => {
            return {
                ref,
                type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
                is_title: false,
                datetime_format: null,
                jumps: []
            };
        };

        //a location is split over three columns (lat, long, accuracy)
        const inputs = [locationInput, textInput(q2Ref), textInput(q3Ref)];
        const currentFormMapping = {
            [locationRef]: { map_to: 'Q1', possible_answers: {} },
            [q2Ref]: { map_to: 'Q2', possible_answers: {} },
            [q3Ref]: { map_to: 'Q3', possible_answers: {} }
        };
        const projectExtra = {
            inputs: {
                [locationRef]: { data: locationInput },
                [q2Ref]: { data: inputs[1] },
                [q3Ref]: { data: inputs[2] }
            }
        };
        const projectDefinition = {
            project: {
                forms: [{ ref: formRef, inputs }]
            }
        };

        //must not throw: the location ref needs to be mapped to one of its headers
        const reverseMapping = reverseEntryParser.getReverseMapping(
            formRef,
            currentFormMapping,
            projectExtra,
            projectDefinition,
            null
        );

        expect(reverseMapping.ref2MapTo[locationRef]).toBe('lat_Q1');
        expect(reverseMapping.reverse.lat_Q1.reverse_jumps).toEqual([{
            to: 'END',
            toInputRef: 'END',
            when: 'ALL',
            answer: null,
            answer_ref: null
        }]);

        //the jump must be applied, keeping the location answer
        const entries = reverseEntryParser.setEntryJumps(
            [buildEntry({
                [locationRef]: { answer: { latitude: 1.5, longitude: 2.5, accuracy: 3 }, was_jumped: false },
                [q2Ref]: { answer: 'hello', was_jumped: false },
                [q3Ref]: { answer: 'world', was_jumped: false }
            })],
            inputs,
            reverseMapping,
            null
        );

        const result = entries[0].data.entry.answers;

        expect(result[locationRef].answer).toEqual({ latitude: 1.5, longitude: 2.5, accuracy: 3 });
        expect(result[locationRef].was_jumped).toBe(false);
        expect(result[q2Ref].was_jumped).toBe(true);
        expect(result[q3Ref].was_jumped).toBe(true);
    });

});
