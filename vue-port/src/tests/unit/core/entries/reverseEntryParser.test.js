import PARAMETERS from '@/config/parameters';
import reverseEntryParser from '@/core/entries/reverseEntryParser';

describe('domain/entries/reverseEntryParser', () => {
  it('creates hierarchy and branch upload payloads', () => {
    const hierarchyEntry = reverseEntryParser.getEntry({
      currentBranchRef: null,
      uuid: 'uuid-1',
      currentFormRef: 'form_1',
      entryTitle: 'Entry Title',
      reverseAnswer: { answer: { q1: { was_jumped: false, answer: 'abc' } } },
      projectVersion: '1',
      parentEntryUuid: 'parent-1',
      parentFormRef: 'form_parent',
      currentBranchOwnerUuid: null
    });

    expect(hierarchyEntry.data.type).toBe('entry');
    expect(hierarchyEntry.data.relationships.parent.data).toEqual({
      parent_form_ref: 'form_parent',
      parent_entry_uuid: 'parent-1'
    });

    const branchEntry = reverseEntryParser.getEntry({
      currentBranchRef: 'branch_1',
      uuid: 'uuid-2',
      currentFormRef: 'form_1',
      entryTitle: 'Branch Entry',
      reverseAnswer: { answer: {} },
      projectVersion: '1',
      parentEntryUuid: null,
      parentFormRef: null,
      currentBranchOwnerUuid: 'owner-1'
    });

    expect(branchEntry.data.type).toBe('branch_entry');
    expect(branchEntry.data.relationships.branch.data).toEqual({
      owner_input_ref: 'branch_1',
      owner_entry_uuid: 'owner-1'
    });
  });

  it('returns jumped refs including group children', () => {
    const inputs = [
      { ref: 'q1', type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE },
      {
        ref: 'group_1',
        type: PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE,
        group: [{ ref: 'group_child_1' }, { ref: 'group_child_2' }]
      },
      { ref: 'q2', type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE },
      { ref: 'q3', type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE }
    ];

    expect(reverseEntryParser.getjumpedInputRefs(inputs, 0, 'q3')).toEqual([
      'group_1',
      'q2',
      'group_child_1',
      'group_child_2'
    ]);
  });

  it('marks jumped answers and clears their values', () => {
    const inputs = [
      {
        ref: 'trigger',
        type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE,
        jumps: [{ when: 'IS', to: 'destination', answer_ref: 'skip_me' }]
      },
      {
        ref: 'target',
        type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
        jumps: []
      },
      {
        ref: 'destination',
        type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
        jumps: []
      }
    ];

    const entries = [
      {
        data: {
          entry: {
            answers: {
              trigger: { was_jumped: false, answer: 'skip_me' },
              target: { was_jumped: false, answer: 'keep?' },
              destination: { was_jumped: false, answer: 'still here' }
            }
          }
        }
      }
    ];

    const reverseMapping = {
      ref2MapTo: {
        trigger: 'trigger_col'
      },
      reverse: {
        trigger_col: {
          reverse_jumps: [{ when: 'IS', toInputRef: 'destination', answer_ref: 'skip_me' }]
        }
      }
    };

    const result = reverseEntryParser.setEntryJumps(entries, inputs, reverseMapping, null);
    expect(result[0].data.entry.answers.target.was_jumped).toBe(true);
    expect(result[0].data.entry.answers.target.answer).toBe('');
  });

  it('converts upload rows into reverse answers with mapping and media defaults', () => {
    const rows = [
      {
        ec5_uuid: 'uuid-1',
        title_col: 'Test entry',
        radio_col: 'Yes',
        check_col: '"A, value", Another',
        lat_location: '51.5007',
        long_location: '-0.1246',
        accuracy_location: '5'
      }
    ];

    const reverseMapping = {
      ref2MapTo: {
        title_input: 'title_col',
        radio_input: 'radio_col',
        checkbox_input: 'check_col',
        location_input: 'location',
        photo_input: 'photo_col'
      },
      reverse: {
        title_col: {
          input_ref: 'title_input',
          type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
          is_title: true,
          reverse_possible_answers: {}
        },
        radio_col: {
          input_ref: 'radio_input',
          type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE,
          is_title: false,
          reverse_possible_answers: {
            Yes: 'ref_yes'
          }
        },
        check_col: {
          input_ref: 'checkbox_input',
          type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE,
          is_title: false,
          reverse_possible_answers: {
            'A, value': 'ref_a',
            Another: 'ref_b'
          }
        },
        lat_location: {
          input_ref: 'location_input',
          type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE,
          is_title: false
        },
        long_location: {
          input_ref: 'location_input',
          type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE,
          is_title: false
        },
        accuracy_location: {
          input_ref: 'location_input',
          type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE,
          is_title: false
        }
      }
    };

    const inputsExtra = {
      title_input: { data: { type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE } },
      radio_input: { data: { type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE } },
      checkbox_input: { data: { type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE } },
      location_input: { data: { type: PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE } },
      photo_input: { data: { type: PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE } }
    };

    const result = reverseEntryParser.getReverseAnswers(rows, reverseMapping, ['branch_1'], null, inputsExtra);

    expect(result[0]).toEqual(
      expect.objectContaining({
        uuid: 'uuid-1',
        title: 'Test entry '
      })
    );

    expect(result[0].answer.radio_input.answer).toBe('ref_yes');
    expect(result[0].answer.checkbox_input.answer).toEqual(['ref_a', 'ref_b']);
    expect(result[0].answer.location_input.answer).toEqual({
      latitude: 51.5007,
      longitude: -0.1246,
      accuracy: 5
    });
    expect(result[0].answer.photo_input.answer).toBe('');
    expect(result[0].answer.branch_1.answer).toBe('');
  });
});
