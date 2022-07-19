import datetime from 'utils/datetime';
import PARAMETERS from 'config/parameters';


describe('datetime utils test', () => {

    it('should render date format 1 (dd/MM/YYYY)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_1)).toBe('24/02/2018');
    });

    it('should render date format 2 (MM/dd/YYYY)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_2)).toBe('02/24/2018');
    });

    it('should render date format 3 (YYYY/MM/dd)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_3)).toBe('2018/02/24');
    });

    it('should render date format 4 (MM/YYYY)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_4)).toBe('02/2018');
    });

    it('should render date format 5 (dd/MM)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_5)).toBe('24/02');
    });

    // //time formats
    // TIME_FORMAT_1: 'HH:mm:ss',
    //     TIME_FORMAT_2: 'hh:mm:ss',
    //     TIME_FORMAT_3: 'HH:mm',
    //     TIME_FORMAT_4: 'hh:mm',
    //     TIME_FORMAT_5: 'mm:ss',

    it('should render time format 1 (HH:mm:ss)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_1)).toBe('17:59:29');
    });

    it('should render time format 2 (hh:mm:ss)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_2)).toBe('05:59:29');
    });

    it('should render time format 3 (HH:mm)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_3)).toBe('17:59');
    });

    it('should render time format 4 (hh:mm)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_4)).toBe('05:59');
    });

    it('should render time format 5 (mm:ss)', () => {
        const dateISO8601 = '2018-02-24T17:59:29.179Z';
        expect(datetime.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_5)).toBe('59:29');
    });

});
