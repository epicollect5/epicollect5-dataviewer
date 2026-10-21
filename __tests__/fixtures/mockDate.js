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

    return MockDate;
};

const restoreRealDate = () => {
    global.Date = RealDate;
};

export {
    RealDate,
    mockCurrentDate,
    restoreRealDate
};
