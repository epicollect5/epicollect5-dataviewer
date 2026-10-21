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
