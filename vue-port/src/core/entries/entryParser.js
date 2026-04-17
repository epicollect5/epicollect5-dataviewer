import moment from 'moment';
import PARAMETERS from '@/config/parameters';
import formatters from '@/core/datetime/formatters';
import entryGroupParser from '@/core/entries/entryGroupParser';

const entryParser = {
  getParsedEntryForDisplay(projectSlug, formRef, currentEntry, inputRef, projectExtra, entryUuid, branchInputRef) {
    const input = projectExtra.inputs[inputRef].data;
    let parsedAnswer = {};
    const rawEntry = branchInputRef ? currentEntry.branch_entry : currentEntry.entry;
    const attributes = currentEntry.attributes;
    const relationships = currentEntry.relationships;
    const inputRawAnswer = rawEntry ? rawEntry.answers[inputRef] : currentEntry.answers[inputRef];
    const uploadedAt = rawEntry ? rawEntry.uploaded_at : currentEntry.uploaded_at;

    if (rawEntry.answers[inputRef].was_jumped) {
      parsedAnswer = [
        {
          entryUuid,
          attributes,
          relationships,
          inputRef: input.ref,
          inputType: input.type,
          cellType: PARAMETERS.CEll_TYPES.TEXT,
          answer: ''
        }
      ];

      return parsedAnswer;
    }

    switch (input.type) {
      case PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE: {
        const groupInputsRefs = projectExtra.forms[formRef].group[input.ref];
        parsedAnswer = entryGroupParser.getParsedGroupEntriesForDisplay(
          projectSlug,
          formRef,
          currentEntry,
          groupInputsRefs,
          projectExtra,
          entryUuid,
          branchInputRef
        );
        break;
      }
      case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
        if (inputRawAnswer.answer.latitude !== '') {
          parsedAnswer = [
            {
              entryUuid,
              attributes,
              relationships,
              inputRef: input.ref,
              inputType: input.type,
              cellType: PARAMETERS.CEll_TYPES.TEXT,
              answer: `${inputRawAnswer.answer.latitude}, ${inputRawAnswer.answer.longitude}`
            }
          ];
        } else {
          parsedAnswer = [
            {
              entryUuid,
              attributes,
              relationships,
              inputRef: input.ref,
              inputType: input.type,
              cellType: PARAMETERS.CEll_TYPES.TEXT,
              answer: ''
            }
          ];
        }
        break;
      case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE: {
        let answer = 0;
        if (currentEntry.attributes.branch_counts) {
          answer = currentEntry.attributes.branch_counts[inputRef];
        }
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.BRANCH,
            answer
          }
        ];
        break;
      }
      case PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.TEXT,
            answer: formatters.getFormattedDate(inputRawAnswer.answer, input.datetime_format)
          }
        ];
        break;
      case PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.TEXT,
            answer: formatters.getFormattedTime(inputRawAnswer.answer, input.datetime_format)
          }
        ];
        break;
      case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.MEDIA,
            answer:
              inputRawAnswer.answer === ''
                ? ''
                : this.getMediaURL(projectSlug, inputRawAnswer.answer, input.type, uploadedAt)
          }
        ];
        break;
      case PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.TEXT,
            answer: this.getMultipleChoiceAnswer(
              projectExtra,
              formRef,
              inputRawAnswer,
              inputRef,
              branchInputRef,
              input
            )
          }
        ];
        break;
      case PARAMETERS.INPUT_TYPES.EC5_DATASET_SINGLE_TYPE:
      case PARAMETERS.INPUT_TYPES.EC5_DATASET_MULTIPLE_TYPE:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.TEXT,
            answer: inputRawAnswer.answer.join(', ')
          }
        ];
        break;
      default:
        parsedAnswer = [
          {
            entryUuid,
            attributes,
            relationships,
            inputRef: input.ref,
            inputType: input.type,
            cellType: PARAMETERS.CEll_TYPES.TEXT,
            answer: inputRawAnswer.answer
          }
        ];
    }

    return parsedAnswer;
  },

  getEmptyEntryForDisplay(currentEntry) {
    const attributes = currentEntry.attributes;
    const relationships = currentEntry.relationships;

    return {
      inputType: PARAMETERS.INPUT_TYPES.TEXT,
      cellType: PARAMETERS.CEll_TYPES.TEXT,
      attributes,
      relationships,
      answer: ''
    };
  },

  getMediaURL(projectSlug, fileName, fileType, uploadedAt) {
    const apiFullPath = PARAMETERS.SERVER_URL + PARAMETERS.API_MEDIA_ENDPOINT;
    const apiProjectMediaPath = `${apiFullPath}${projectSlug}?type=${fileType}`;
    let mediaObj = {};

    switch (fileType) {
      case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
        mediaObj = {
          entry_original: `${apiProjectMediaPath}&format=audio&name=${fileName}`,
          entry_thumb: null,
          entry_sidebar: null,
          entry_default: `${apiProjectMediaPath}&format=audio&name=${fileName}`
        };
        break;
      case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE: {
        const timestamp = uploadedAt ? moment(uploadedAt).unix() : '';
        const version = timestamp ? `&v=${timestamp}` : '';
        mediaObj = {
          entry_original: `${apiProjectMediaPath}&format=entry_original&name=${fileName}${version}`,
          entry_thumb: `${apiProjectMediaPath}&format=entry_thumb&name=${fileName}${version}`,
          entry_sidebar: `${apiProjectMediaPath}&format=entry_original&name=${fileName}${version}`,
          entry_default: `${apiProjectMediaPath}&format=entry_thumb&name=${fileName}${version}`
        };
        break;
      }
      case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
        mediaObj = {
          entry_original: `${apiProjectMediaPath}&format=video&name=${fileName}`,
          entry_thumb: null,
          entry_sidebar: null,
          entry_default: `${apiProjectMediaPath}&format=video&name=${fileName}`
        };
        break;
      default:
    }

    return mediaObj;
  },

  getMultipleChoiceAnswer(projectExtra, formRef, inputRawAnswer, inputRef, branchInputRef, input) {
    let possibleAnswers = {};
    let answer = '';
    let multipleChoiceAnswer;
    const parsedCheckboxAnswer = [];

    if (branchInputRef) {
      multipleChoiceAnswer = projectExtra.forms[formRef].lists.multiple_choice_inputs.branch[branchInputRef][inputRef];
    } else {
      multipleChoiceAnswer = projectExtra.forms[formRef].lists.multiple_choice_inputs.form[inputRef];
    }

    if (multipleChoiceAnswer) {
      possibleAnswers = multipleChoiceAnswer.possible_answers;

      switch (input.type) {
        case PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE:
        case PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE:
        case PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE:
          inputRawAnswer.answer.forEach((answerRef) => {
            parsedCheckboxAnswer.push(possibleAnswers[answerRef]);
          });
          answer = parsedCheckboxAnswer.join(', ');
          break;
        default:
          answer = possibleAnswers[inputRawAnswer.answer];
      }
    }

    return answer;
  }
};

export default entryParser;
