import moment from 'moment';
import Papa from 'papaparse';
import PARAMETERS from '@/core/config/parameters';
import helpers from '@/utils/helpers';

const reverseEntryParser = {
  getEntry(params) {
    const type = params.currentBranchRef === null ? 'entry' : 'branch_entry';

    const entry = {
      data: {
        type,
        id: params.uuid,
        attributes: {
          form: {
            ref: params.currentFormRef,
            type: 'hierarchy'
          }
        },
        relationships: {
          parent: {},
          branch: {}
        },
        [type]: {
          entry_uuid: params.uuid,
          created_at: moment().toISOString(),
          device_id: '',
          platform: 'WEB',
          title: params.entryTitle,
          answers: params.reverseAnswer.answer,
          project_version: params.projectVersion
        }
      }
    };

    if (params.currentBranchRef === null) {
      if (params.parentEntryUuid !== null && params.parentFormRef !== null) {
        entry.data.relationships.parent = {
          data: {
            parent_form_ref: params.parentFormRef,
            parent_entry_uuid: params.parentEntryUuid
          }
        };
      }
    } else if (params.currentBranchOwnerUuid !== null && params.currentBranchRef !== null) {
      entry.data.relationships.branch = {
        data: {
          owner_input_ref: params.currentBranchRef,
          owner_entry_uuid: params.currentBranchOwnerUuid
        }
      };
    }

    return entry;
  },

  setEntryJumps(entries, inputs, reverseMapping, currentBranchRef) {
    const entriesClone = entries.slice(0);
    const entryType = currentBranchRef ? 'branch_entry' : 'entry';

    entriesClone.forEach((entry, entryIndex) => {
      let questionsJumpedRefs = new Set([]);

      inputs.forEach((input, inputIndex) => {
        if (questionsJumpedRefs.has(input.ref)) {
          return [];
        }

        if (input.jumps.length > 0) {
          let key;
          let entryMapping;
          let reverseJumps;
          let jumpedInputsRefs = [];

          if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
            entryMapping = reverseMapping.reverse[`readme_${input.ref}`];
            reverseJumps = entryMapping.reverse_jumps;
          } else {
            key = reverseMapping.ref2MapTo[input.ref];
            entryMapping = reverseMapping.reverse[key];
            reverseJumps = entryMapping.reverse_jumps;
          }

          reverseJumps.some((reverseJump) => {
            if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
              const destinationRef = reverseJump.toInputRef;
              jumpedInputsRefs = this.getjumpedInputRefs(inputs, inputIndex, destinationRef);
              questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
            } else {
              if (!entry.data[entryType].answers[input.ref]) {
                return true;
              }

              const answer = entry.data[entryType].answers[input.ref].answer;

              switch (reverseJump.when) {
                case 'IS':
                  if (helpers.doesAnswerMatchAJump(input, reverseJump, answer, 'IS')) {
                    const destinationRef = reverseJump.toInputRef;
                    jumpedInputsRefs = this.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                    questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                  }
                  break;
                case 'IS_NOT':
                  if (helpers.doesAnswerMatchAJump(input, reverseJump, answer, 'IS_NOT')) {
                    const destinationRef = reverseJump.toInputRef;
                    jumpedInputsRefs = this.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                    questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                  }
                  break;
                case 'ALL': {
                  const destinationRef = reverseJump.toInputRef;
                  jumpedInputsRefs = this.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                  questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                  break;
                }
                case 'NO_ANSWER_GIVEN':
                  if (reverseJump.answer_ref === null) {
                    const destinationRef = reverseJump.toInputRef;
                    jumpedInputsRefs = this.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                    questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                  }
                  break;
                default:
              }
            }

            return jumpedInputsRefs.length > 0;
          });

          Object.keys(entry.data[entryType].answers).forEach((inputRef) => {
            const inputTypesWithAnswerArray = [
              PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE,
              PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE,
              PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE
            ];

            if (questionsJumpedRefs.has(inputRef)) {
              entriesClone[entryIndex].data[entryType].answers[inputRef].was_jumped = true;

              if (inputTypesWithAnswerArray.includes(input.type)) {
                entriesClone[entryIndex].data[entryType].answers[inputRef].answer = [];
              } else {
                entriesClone[entryIndex].data[entryType].answers[inputRef].answer = '';
              }
            }
          });
        }

        return [];
      });
    });

    return entriesClone;
  },

  getjumpedInputRefs(inputs, inputIndex, destinationRef) {
    let refs = [];
    let jumpedInputs = [];
    const groupInputRefs = [];

    for (let currentIndex = inputIndex + 1; currentIndex < inputs.length; currentIndex += 1) {
      if (destinationRef === 'END') {
        jumpedInputs = inputs.slice(inputIndex + 1);

        refs = jumpedInputs.map((jumpedInput) => {
          if (jumpedInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
            jumpedInput.group.forEach((groupInput) => {
              groupInputRefs.push(groupInput.ref);
            });
          }

          return jumpedInput.ref;
        });

        break;
      } else if (inputs[currentIndex].ref === destinationRef) {
        jumpedInputs = inputs.slice(inputIndex + 1, currentIndex);

        refs = jumpedInputs.map((jumpedInput) => {
          if (jumpedInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
            jumpedInput.group.forEach((groupInput) => {
              groupInputRefs.push(groupInput.ref);
            });
          }

          return jumpedInput.ref;
        });
        break;
      }
    }

    return refs.concat(groupInputRefs);
  },

  getReverseAnswers(rows, reverseMapping, branches, currentBranchRef, inputsExtra) {
    const reverseAnswers = [];
    const inputRefs = Object.keys(reverseMapping.ref2MapTo);
    let answerRefsForUpload = [];

    rows.forEach((row) => {
      const reverseAnswer = {};
      let title = '';
      let hasTitle = false;

      Object.entries(row).forEach((answer) => {
        const header = answer[0].trim();
        const answerValue = answer[1].trim();
        const question = reverseMapping.reverse[header];
        let accuracy;
        let latitude;
        let longitude;

        if (question) {
          if (question.is_title) {
            hasTitle = true;
            title += `${answerValue} `;
          }

          switch (question.type) {
            case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
              if (reverseAnswer[question.input_ref] === undefined) {
                reverseAnswer[question.input_ref] = { was_jumped: false };
              }

              if (reverseAnswer[question.input_ref].answer === undefined) {
                reverseAnswer[question.input_ref].answer = {};
              }

              if (header.startsWith('lat_')) {
                if (answerValue === '') {
                  reverseAnswer[question.input_ref].answer.latitude = '';
                } else {
                  latitude = parseFloat(parseFloat(answerValue).toFixed(6));
                  reverseAnswer[question.input_ref].answer.latitude = Number.isNaN(latitude) ? null : latitude;
                }
              }

              if (header.startsWith('long_')) {
                if (answerValue === '') {
                  reverseAnswer[question.input_ref].answer.longitude = '';
                } else {
                  longitude = parseFloat(parseFloat(answerValue).toFixed(6));
                  reverseAnswer[question.input_ref].answer.longitude = Number.isNaN(longitude) ? null : longitude;
                }
              }

              if (header.startsWith('accuracy_')) {
                if (answerValue === '') {
                  reverseAnswer[question.input_ref].answer.accuracy = '';
                } else {
                  accuracy = parseInt(answerValue, 10);
                  reverseAnswer[question.input_ref].answer.accuracy = Number.isNaN(accuracy) ? null : accuracy;
                }
              }
              break;
            case PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_INTEGER_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_DECIMAL_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_PHONE_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_TEXTAREA_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_BARCODE_TYPE:
              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: answerValue
              };
              break;
            case PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE: {
              let dateAnswer;
              let parts;

              if (answerValue === '') {
                dateAnswer = '';
              } else {
                parts = answerValue.split('/');
                switch (question.datetime_format) {
                  case PARAMETERS.DATE_FORMAT_1:
                    dateAnswer = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    break;
                  case PARAMETERS.DATE_FORMAT_2:
                    dateAnswer = `${parts[2]}-${parts[0]}-${parts[1]}`;
                    break;
                  case PARAMETERS.DATE_FORMAT_3:
                    dateAnswer = `${parts[0]}-${parts[1]}-${parts[2]}`;
                    break;
                  case PARAMETERS.DATE_FORMAT_4:
                    dateAnswer = `${parts[1]}-${parts[0]}-01`;
                    break;
                  case PARAMETERS.DATE_FORMAT_5:
                    dateAnswer = `${new Date().getUTCFullYear()}-${parts[1]}-${parts[0]}`;
                    break;
                  default:
                }
                dateAnswer += 'T00:00:00.000';
              }

              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: dateAnswer
              };
              break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE: {
              let timeAnswer;
              let parts;
              const today = new Date();
              const year = today.getUTCFullYear();
              const month = `0${today.getUTCMonth() + 1}`.slice(-2);
              const day = `0${today.getUTCDay()}`.slice(-2);

              if (answerValue === '') {
                timeAnswer = '';
              } else {
                parts = answerValue.split(':');
                switch (question.datetime_format) {
                  case PARAMETERS.TIME_FORMAT_1:
                  case PARAMETERS.TIME_FORMAT_2:
                    timeAnswer = `${parts[0]}:${parts[1]}:${parts[2]}`;
                    break;
                  case PARAMETERS.TIME_FORMAT_3:
                  case PARAMETERS.TIME_FORMAT_4:
                    timeAnswer = `${parts[0]}:${parts[1]}:00`;
                    break;
                  case PARAMETERS.TIME_FORMAT_5:
                    timeAnswer = `00:${parts[1]}:${parts[0]}`;
                    break;
                  default:
                }
                timeAnswer = `${year}-${month}-${day}T${timeAnswer}.000`;
              }

              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: timeAnswer
              };
              break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE: {
              let mappedAnswer = '';
              if (answerValue !== '') {
                mappedAnswer = question.reverse_possible_answers[answerValue] || answerValue;
              }

              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: mappedAnswer
              };
              break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE: {
              const answerRefs = [];

              if (answerValue !== '') {
                const answerValueSanitised = answerValue.replace(/\s*, "\s*/g, ',"');
                const parsedAnswer = Papa.parse(answerValueSanitised, {
                  delimiter: ',',
                  transform: (element) => element.trim()
                });

                parsedAnswer.data[0].forEach((element) => {
                  answerRefs.push(question.reverse_possible_answers[element] || `-${element}-`);
                });
              }

              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: answerRefs
              };
              break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE:
            default:
              reverseAnswer[question.input_ref] = {
                was_jumped: false,
                answer: ''
              };
          }
        }
      });

      answerRefsForUpload = Object.keys(reverseAnswer);
      const difference = inputRefs.filter((ref) => !answerRefsForUpload.includes(ref));

      if (difference.length > 0) {
        difference.forEach((inputRef) => {
          if (PARAMETERS.MEDIA_TYPES.indexOf(inputsExtra[inputRef].data.type) > -1) {
            reverseAnswer[inputRef] = {
              was_jumped: false,
              answer: ''
            };
          }
        });
      }

      if (branches.length > 0) {
        branches.forEach((branchRef) => {
          reverseAnswer[branchRef] = {
            was_jumped: false,
            answer: ''
          };
        });
      }

      reverseAnswers.push({
        answer: reverseAnswer,
        title: hasTitle ? title : null,
        uuid: currentBranchRef ? (row.ec5_branch_uuid === '' ? null : row.ec5_branch_uuid) : (row.ec5_uuid === '' ? null : row.ec5_uuid)
      });
    });

    return reverseAnswers;
  },

  getReverseMapping(currentFormRef, currentFormMapping, projectExtra, projectDefinition, currentBranchRef) {
    const reverseMapping = {};
    const mappingHashMap = {};
    let currentBranchInputIndex;
    let inputs;

    Object.entries(currentFormMapping).forEach((value) => {
      const inputRef = value[0];
      const input = projectExtra.inputs[inputRef].data;
      const possibleAnswers = {};
      let mapTo;

      switch (input.type) {
        case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
          mapTo = `lat_${value[1].map_to}`;
          reverseMapping[mapTo] = value[1];
          reverseMapping[mapTo].input_ref = inputRef;
          reverseMapping[mapTo].type = input.type;

          mapTo = `long_${value[1].map_to}`;
          reverseMapping[mapTo] = value[1];
          reverseMapping[mapTo].input_ref = inputRef;
          reverseMapping[mapTo].type = input.type;

          mapTo = `accuracy_${value[1].map_to}`;
          reverseMapping[mapTo] = value[1];
          reverseMapping[mapTo].input_ref = inputRef;
          reverseMapping[mapTo].type = input.type;
          break;
        case PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE:
          mapTo = value[1].map_to;
          reverseMapping[mapTo] = value[1];
          reverseMapping[mapTo].input_ref = inputRef;
          reverseMapping[mapTo].type = input.type;
          mappingHashMap[inputRef] = value[1].map_to;

          Object.entries(value[1].group).forEach((groupValue) => {
            const groupInputRef = groupValue[0];
            const groupInput = projectExtra.inputs[groupInputRef].data;
            const groupInputPossibleAnswers = {};
            let groupMapTo;

            switch (groupInput.type) {
              case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
                groupMapTo = `lat_${groupValue[1].map_to}`;
                reverseMapping[groupMapTo] = groupValue[1];
                reverseMapping[groupMapTo].input_ref = groupInputRef;
                reverseMapping[groupMapTo].type = groupInput.type;

                groupMapTo = `long_${groupValue[1].map_to}`;
                reverseMapping[groupMapTo] = groupValue[1];
                reverseMapping[groupMapTo].input_ref = groupInputRef;
                reverseMapping[groupMapTo].type = groupInput.type;

                groupMapTo = `accuracy_${groupValue[1].map_to}`;
                reverseMapping[groupMapTo] = groupValue[1];
                reverseMapping[groupMapTo].input_ref = groupInputRef;
                reverseMapping[groupMapTo].type = groupInput.type;
                break;
              case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE:
                break;
              default:
                groupMapTo = groupValue[1].map_to;
                reverseMapping[groupMapTo] = groupValue[1];
                reverseMapping[groupMapTo].input_ref = groupInputRef;
                reverseMapping[groupMapTo].type = groupInput.type;

                if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(groupInput.type) !== -1) {
                  Object.entries(groupValue[1].possible_answers).forEach((possibleAnswer) => {
                    groupInputPossibleAnswers[possibleAnswer[1].map_to.trim()] = possibleAnswer[0];
                  });
                }
                mappingHashMap[groupInputRef] = groupValue[1].map_to;
            }

            reverseMapping[groupMapTo].is_title = groupInput.is_title;
            reverseMapping[groupMapTo].datetime_format = groupInput.datetime_format;
            reverseMapping[groupMapTo].reverse_possible_answers = groupInputPossibleAnswers;
          });
          break;
        case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE:
          break;
        default:
          mapTo = value[1].map_to;
          reverseMapping[mapTo] = value[1];
          reverseMapping[mapTo].input_ref = inputRef;
          reverseMapping[mapTo].type = input.type;

          if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(input.type) !== -1) {
            Object.entries(value[1].possible_answers).forEach((possibleAnswer) => {
              possibleAnswers[possibleAnswer[1].map_to.trim()] = possibleAnswer[0];
            });
          }

          mappingHashMap[inputRef] = value[1].map_to;
      }

      if (reverseMapping[mapTo]) {
        reverseMapping[mapTo].is_title = input.is_title;
        reverseMapping[mapTo].datetime_format = input.datetime_format;
        reverseMapping[mapTo].reverse_possible_answers = possibleAnswers;
      }
    });

    const forms = projectDefinition.project.forms;
    const currentFormIndex = helpers.getFormIndexFromRef(forms, currentFormRef);

    if (currentBranchRef !== null) {
      currentBranchInputIndex = helpers.getBranchInputIndexFromRef(forms[currentFormIndex].inputs, currentBranchRef);
      inputs = forms[currentFormIndex].inputs[currentBranchInputIndex].branch;
    } else {
      inputs = forms[currentFormIndex].inputs;
    }

    inputs.forEach((input) => {
      const reverseEntryMapping = reverseMapping[mappingHashMap[input.ref]];
      const reverseJumps = [];

      if (input.jumps.length > 0) {
        input.jumps.forEach((jump) => {
          if (jump.answer_ref === null) {
            reverseJumps.push({
              to: jump.to === 'END' ? 'END' : mappingHashMap[input.ref],
              toInputRef: jump.to,
              when: jump.when,
              answer: null,
              answer_ref: jump.answer_ref
            });
          } else {
            reverseJumps.push({
              to: mappingHashMap[input.ref],
              toInputRef: jump.to,
              when: jump.when,
              answer: reverseEntryMapping.possible_answers[jump.answer_ref].map_to,
              answer_ref: jump.answer_ref
            });
          }
        });

        if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
          reverseMapping[`readme_${input.ref}`] = {
            reverse_jumps: reverseJumps
          };
        } else {
          reverseMapping[mappingHashMap[input.ref]].reverse_jumps = reverseJumps;
        }
      }
    });

    return { reverse: reverseMapping, ref2MapTo: mappingHashMap };
  }
};

export default reverseEntryParser;
