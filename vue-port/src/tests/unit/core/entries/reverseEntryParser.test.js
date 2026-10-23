import PARAMETERS from '@/core/config/parameters';
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

const buildInput = (ref, type, jumps, group) => ({
  ref,
  type,
  jumps: jumps || [],
  group: group || []
});

const buildEntry = (answers) => ({
  data: {
    type: 'entry',
    entry: {
      answers
    }
  }
});

const jumpMappingFor = (inputRef, mapTo, when, answerRef, toInputRef) => ({
  ref2MapTo: {
    [inputRef]: mapTo
  },
  reverse: {
    [mapTo]: {
      reverse_jumps: [
        {
          toInputRef: toInputRef || 'END',
          when,
          answer: null,
          answer_ref: answerRef
        }
      ]
    }
  }
});

describe('domain/entries/reverseEntryParser time answers', () => {
  const reverseMappingForTime = (timeFormat) => ({
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
  });

  const parseTimeAnswer = (answerValue, timeFormat) => {
    const reverseAnswers = reverseEntryParser.getReverseAnswers(
      [{ ec5_uuid: '', 'Time question': answerValue }],
      reverseMappingForTime(timeFormat),
      [],
      null,
      {}
    );

    return reverseAnswers[0].answer['time-input-ref'].answer;
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the day of the month, not the day of the week', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T20:26:00.000Z'));

    expect(parseTimeAnswer('20:26', PARAMETERS.TIME_FORMAT_3)).toBe('2026-10-25T20:26:00.000');
  });

  it('does not swap minutes and seconds for mm:ss answers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T20:26:00.000Z'));

    expect(parseTimeAnswer('59:29', PARAMETERS.TIME_FORMAT_5)).toBe('2026-10-25T00:59:29.000');
  });

  it('keeps empty answers empty', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-25T20:26:00.000Z'));

    expect(parseTimeAnswer('', PARAMETERS.TIME_FORMAT_3)).toBe('');
  });
});

describe('domain/entries/reverseEntryParser jumps', () => {
  it('uses the jumped question type for empty answers', () => {
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

  it('only jumps on NO_ANSWER_GIVEN when the answer is empty', () => {
    const noAnswerJump = [{ to: 'q3', when: 'NO_ANSWER_GIVEN', answer_ref: null }];
    const inputs = [buildInput('source', 'dropdown', noAnswerJump), buildInput('q2', 'text'), buildInput('q3', 'text')];
    const answered = buildEntry({
      source: { answer: 'yes-ref', was_jumped: false },
      q2: { answer: 'keep me', was_jumped: false },
      q3: { answer: 'target', was_jumped: false }
    });
    const unanswered = buildEntry({
      source: { answer: '', was_jumped: false },
      q2: { answer: 'keep me', was_jumped: false },
      q3: { answer: 'target', was_jumped: false }
    });

    const entries = reverseEntryParser.setEntryJumps(
      [answered, unanswered],
      inputs,
      jumpMappingFor('source', 'Source Q', 'NO_ANSWER_GIVEN', null, 'q3'),
      null
    );

    expect(entries[0].data.entry.answers.q2.answer).toBe('keep me');
    expect(entries[0].data.entry.answers.q2.was_jumped).toBe(false);
    expect(entries[1].data.entry.answers.q2.answer).toBe('');
    expect(entries[1].data.entry.answers.q2.was_jumped).toBe(true);
  });

  it('reverse maps and applies a jump on a location question', () => {
    const formRef = 'form-ref';
    const locationRef = 'q1-location';
    const q2Ref = 'q2-text';
    const q3Ref = 'q3-text';
    const locationInput = buildInput(locationRef, PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE, [
      { to: 'END', when: 'ALL', answer_ref: null }
    ]);
    const textInput = (ref) => buildInput(ref, PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE);
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

    const reverseMapping = reverseEntryParser.getReverseMapping(
      formRef,
      currentFormMapping,
      projectExtra,
      projectDefinition,
      null
    );

    expect(reverseMapping.ref2MapTo[locationRef]).toBe('lat_Q1');
    expect(reverseMapping.reverse.lat_Q1.reverse_jumps).toEqual([
      {
        to: 'END',
        toInputRef: 'END',
        when: 'ALL',
        answer: null,
        answer_ref: null
      }
    ]);

    const entries = reverseEntryParser.setEntryJumps(
      [
        buildEntry({
          [locationRef]: { answer: { latitude: 1.5, longitude: 2.5, accuracy: 3 }, was_jumped: false },
          [q2Ref]: { answer: 'hello', was_jumped: false },
          [q3Ref]: { answer: 'world', was_jumped: false }
        })
      ],
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
