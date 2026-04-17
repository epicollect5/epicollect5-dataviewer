import PARAMETERS from '@/config/parameters';
import formatters from '@/core/datetime/formatters';

describe('domain/datetime/formatters', () => {
  const dateISO8601 = '2018-02-24T17:59:29.179Z';

  it('formats legacy date variants', () => {
    expect(formatters.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_1)).toBe('24/02/2018');
    expect(formatters.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_2)).toBe('02/24/2018');
    expect(formatters.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_3)).toBe('2018/02/24');
    expect(formatters.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_4)).toBe('02/2018');
    expect(formatters.getFormattedDate(dateISO8601, PARAMETERS.DATE_FORMAT_5)).toBe('24/02');
  });

  it('formats legacy time variants', () => {
    expect(formatters.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_1)).toBe('17:59:29');
    expect(formatters.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_2)).toBe('05:59:29');
    expect(formatters.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_3)).toBe('17:59');
    expect(formatters.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_4)).toBe('05:59');
    expect(formatters.getFormattedTime(dateISO8601, PARAMETERS.TIME_FORMAT_5)).toBe('59:29');
  });

  it('compares utc day boundaries', () => {
    expect(
      formatters.doDatesHaveSameDay(
        new Date('2024-01-01T00:00:00.000Z'),
        new Date('2024-01-01T23:59:59.000Z')
      )
    ).toBe(true);

    expect(formatters.doDatesHaveSameDay(new Date('2024-01-01T00:00:00.000Z'), '2024-01-01')).toBe(false);
  });
});
