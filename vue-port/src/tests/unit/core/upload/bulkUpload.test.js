import PARAMETERS from '@/config/parameters';
import bulkUpload from '@/core/upload/bulkUpload';

describe('domain/upload/bulkUpload', () => {
  it('formats original failed date and time answers', () => {
    const currentEntry = {
      data: {
        entry: {
          answers: {
            date_field: { answer: '2018-02-24T17:59:29.179Z' },
            time_field: { answer: '2018-02-24T17:59:29.179Z' }
          }
        }
      }
    };

    expect(
      bulkUpload.getFailedOriginalAnswer(
        { ref: 'date_field', type: PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE, datetime_format: PARAMETERS.DATE_FORMAT_1 },
        { possible_answers: {} },
        currentEntry,
        'entry'
      )
    ).toBe('24/02/2018');

    expect(
      bulkUpload.getFailedOriginalAnswer(
        { ref: 'time_field', type: PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE, datetime_format: PARAMETERS.TIME_FORMAT_4 },
        { possible_answers: {} },
        currentEntry,
        'entry'
      )
    ).toBe('05:59');
  });

  it('maps multiple-choice failed answers back to display values', () => {
    const currentEntry = {
      data: {
        entry: {
          answers: {
            radio_field: { answer: 'ref_2' },
            checkbox_field: { answer: ['ref_1', '-Unknown-'] }
          }
        }
      }
    };

    expect(
      bulkUpload.getFailedOriginalAnswer(
        { ref: 'radio_field', type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE },
        { possible_answers: { ref_2: { map_to: 'Yes' } } },
        currentEntry,
        'entry'
      )
    ).toBe('Yes');

    expect(
      bulkUpload.getFailedOriginalAnswer(
        { ref: 'checkbox_field', type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE },
        { possible_answers: { ref_1: { map_to: 'Apple' } } },
        currentEntry,
        'entry'
      )
    ).toBe('Apple, Unknown');
  });
});
