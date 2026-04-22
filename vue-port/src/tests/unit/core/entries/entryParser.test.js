import PARAMETERS from '@/core/config/parameters';
import entryParser from '@/core/entries/entryParser';
import entryGroupParser from '@/core/entries/entryGroupParser';
import tableModel from '@/core/entries/tableModel';

const projectSlug = 'demo-project';
const formRef = 'form_1';

const projectExtra = {
  forms: {
    [formRef]: {
      inputs: ['location_input', 'radio_input', 'photo_input', 'group_input'],
      group: {
        group_input: ['group_text', 'group_readme']
      },
      lists: {
        multiple_choice_inputs: {
          form: {
            radio_input: {
              possible_answers: {
                a1: 'Alpha',
                a2: 'Beta'
              }
            }
          },
          branch: {}
        }
      }
    }
  },
  inputs: {
    location_input: {
      data: {
        ref: 'location_input',
        type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE,
        question: 'Location'
      }
    },
    radio_input: {
      data: {
        ref: 'radio_input',
        type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE,
        question: 'Choice'
      }
    },
    photo_input: {
      data: {
        ref: 'photo_input',
        type: PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE,
        question: 'Photo'
      }
    },
    group_input: {
      data: {
        ref: 'group_input',
        type: PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE,
        question: 'Group'
      }
    },
    group_text: {
      data: {
        ref: 'group_text',
        type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
        question: 'Group text'
      }
    },
    group_readme: {
      data: {
        ref: 'group_readme',
        type: PARAMETERS.INPUT_TYPES.EC5_README_TYPE,
        question: 'Ignore'
      }
    }
  }
};

const singleEntry = {
  attributes: {
    child_counts: 0,
    branch_counts: {}
  },
  relationships: {},
  entry: {
    entry_uuid: 'uuid-1',
    title: 'Entry one',
    created_at: '2024-01-15T09:00:00.000Z',
    uploaded_at: '2024-01-15T09:00:00.000Z',
    answers: {
      location_input: {
        was_jumped: false,
        answer: {
          latitude: 51.123456,
          longitude: -1.987654
        }
      },
      radio_input: {
        was_jumped: false,
        answer: 'a2'
      },
      photo_input: {
        was_jumped: false,
        answer: 'photo.jpg'
      },
      group_text: {
        was_jumped: false,
        answer: 'Nested answer'
      }
    }
  }
};

describe('domain/entries/entryParser', () => {
  it('parses location, multiple choice, media, and empty answers', () => {
    expect(
      entryParser.getParsedEntryForDisplay(projectSlug, formRef, singleEntry, 'location_input', projectExtra, 'uuid-1')
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          answer: '51.123456, -1.987654',
          cellType: PARAMETERS.CEll_TYPES.TEXT
        })
      ])
    );

    expect(
      entryParser.getParsedEntryForDisplay(projectSlug, formRef, singleEntry, 'radio_input', projectExtra, 'uuid-1')
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          answer: 'Beta'
        })
      ])
    );

    expect(
      entryParser.getParsedEntryForDisplay(projectSlug, formRef, singleEntry, 'photo_input', projectExtra, 'uuid-1')
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          answer: expect.objectContaining({
            entry_original: expect.stringContaining('photo.jpg')
          }),
          cellType: PARAMETERS.CEll_TYPES.MEDIA
        })
      ])
    );

    expect(entryParser.getEmptyEntryForDisplay(singleEntry)).toEqual(
      expect.objectContaining({
        answer: '',
        cellType: PARAMETERS.CEll_TYPES.TEXT
      })
    );
  });

  it('flattens group entries and table headers', () => {
    expect(
      entryGroupParser.getParsedGroupEntriesForDisplay(
        projectSlug,
        formRef,
        singleEntry,
        ['group_text', 'group_readme'],
        projectExtra,
        'uuid-1',
        false
      )
    ).toEqual([
      expect.objectContaining({
        answer: 'Nested answer'
      })
    ]);

    expect(tableModel.getHeaders(projectExtra, formRef)).toEqual([
      { inputRef: 'location_input', question: 'Location' },
      { inputRef: 'radio_input', question: 'Choice' },
      { inputRef: 'photo_input', question: 'Photo' },
      { groupInputRef: 'group_text', question: 'Group text' }
    ]);
  });
});
