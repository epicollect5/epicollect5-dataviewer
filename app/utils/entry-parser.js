import PARAMETERS from 'config/parameters';
import datetime from 'utils/datetime';
import entryGroupParser from 'utils/entry-group-parser';

//parse entry to get a flat list (excluded: GROUP, README type)
const entryParser = {
    /*parse entry based on type and return parsed object
     notice the object is wrapped in an array so we can use the spread operator on the function caller
     */
    getParsedEntryForDisplay (projectSlug, formRef, currentEntry, inputRef, projectExtra, entryUuid, branchInputRef) {

        const self = this;
        const input = projectExtra.inputs[inputRef].data;
        let parsedAnswer = {};
        const rawEntry = branchInputRef ? currentEntry.branch_entry : currentEntry.entry;
        const attributes = currentEntry.attributes;
        const relationships = currentEntry.relationships;
        const inputRawAnswer = rawEntry.answers[inputRef];

        //was the question jumped? return immediatley with an empty answer object
        if (rawEntry.answers[inputRef].was_jumped) {
            //set it to empty string then
            parsedAnswer = [{
                entryUuid,
                attributes,
                relationships,
                inputRef: input.ref,
                inputType: input.type,
                cellType: PARAMETERS.CEll_TYPES.TEXT,
                answer: ''
            }];
            return parsedAnswer;
        }

        //ok, the question was answered so parse it properly
        switch (input.type) {

            //**************************************************************************************************
            //IMPORTANT: this is here for legacy, as the input group ref was here at the beginning, it got removed
            //with the new structure, a group inppu should never slip through here
            case PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE: {
                //get all the group answers as a flat list
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
            //**************************************************************************************************
            case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE: {
                //check if we have a location
                if (inputRawAnswer.answer.latitude !== '') {
                    parsedAnswer = [{
                        entryUuid,
                        attributes,
                        relationships,
                        inputRef: input.ref,
                        inputType: input.type,
                        cellType: PARAMETERS.CEll_TYPES.TEXT,
                        answer: inputRawAnswer.answer.latitude + ', ' + inputRawAnswer.answer.longitude
                    }];
                } else {
                    //no location return empty string
                    parsedAnswer = [{
                        entryUuid,
                        attributes,
                        relationships,
                        inputRef: input.ref,
                        inputType: input.type,
                        cellType: PARAMETERS.CEll_TYPES.TEXT,
                        answer: ''
                    }];
                }
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE: {

                let answer = 0;
                if (currentEntry.attributes.branch_counts) {
                    answer = currentEntry.attributes.branch_counts[inputRef];
                }
                //get the branch count
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.BRANCH,
                    answer
                }];
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE: {
                //format date to datetime_format
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: datetime.getFormattedDate(inputRawAnswer.answer, input.datetime_format)
                }];
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE:
                //format time to datetime_format
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: datetime.getFormattedTime(inputRawAnswer.answer, input.datetime_format)
                }];
                break;
            case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.MEDIA,
                    answer: inputRawAnswer.answer === '' ? '' : self.getMediaURL(projectSlug, inputRawAnswer.answer, input.type)
                }];
                break;
            case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.MEDIA,
                    answer: inputRawAnswer.answer === '' ? '' : self.getMediaURL(projectSlug, inputRawAnswer.answer, input.type)
                }];
                break;
            case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE: {
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.MEDIA,
                    answer: inputRawAnswer.answer === '' ? '' : self.getMediaURL(projectSlug, inputRawAnswer.answer, input.type)
                }];
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE: {
                //swap answer_ref (we send those for multiple answers inputs) with answer text
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: this.getMultipleChoiceAnswer(projectExtra, formRef, inputRawAnswer, inputRef, branchInputRef, input)
                }];
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE: {

                //swap answer_ref (we send those for multiple answers inputs) with answer text
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: this.getMultipleChoiceAnswer(projectExtra, formRef, inputRawAnswer, inputRef, branchInputRef, input)
                }];
                break;
            }
            case PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE: {
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: this.getMultipleChoiceAnswer(projectExtra, formRef, inputRawAnswer, inputRef, branchInputRef, input)
                }];
                break;
            }

            //dataset type is hybrid: comes as array, but does not have mapping
            case PARAMETERS.INPUT_TYPES.EC5_DATASET_SINGLE_TYPE:
            case PARAMETERS.INPUT_TYPES.EC5_DATASET_MULTIPLE_TYPE: {
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: inputRawAnswer.answer.join(', ')
                }];
                break;
            }

            default:
                parsedAnswer = [{
                    entryUuid,
                    attributes,
                    relationships,
                    inputRef: input.ref,
                    inputType: input.type,
                    cellType: PARAMETERS.CEll_TYPES.TEXT,
                    answer: inputRawAnswer.answer
                }];
        }

        return parsedAnswer;
    },

    getEmptyEntryForDisplay (currentEntry) {
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

    getMediaURL (projectSlug, fileName, fileType) {

        const apiFullPath = PARAMETERS.SERVER_URL + PARAMETERS.API_MEDIA_ENDPOINT;
        const apiProjectMediaPath = apiFullPath + projectSlug + '?type=' + fileType;
        let mediaObj = {};

        switch (fileType) {

            case PARAMETERS.INPUT_TYPES.EC5_AUDIO_TYPE:
                mediaObj = {
                    entry_original: apiProjectMediaPath + '&format=audio&name=' + fileName,
                    entry_thumb: null,
                    entry_sidebar: null,
                    entry_default: apiProjectMediaPath + '&format=audio&name=' + fileName
                };
                break;

            case PARAMETERS.INPUT_TYPES.EC5_PHOTO_TYPE:
                mediaObj = {
                    entry_original: apiProjectMediaPath + '&format=entry_original&name=' + fileName,
                    entry_thumb: apiProjectMediaPath + '&format=entry_thumb&name=' + fileName,
                    //using original image instead of legacy sidebar size to save a lot of GB in storage
                    entry_sidebar: apiProjectMediaPath + '&format=entry_original&name=' + fileName,
                    entry_default: apiProjectMediaPath + '&format=entry_thumb&name=' + fileName
                };
                break;

            case PARAMETERS.INPUT_TYPES.EC5_VIDEO_TYPE:
                mediaObj = {
                    entry_original: apiProjectMediaPath + '&format=video&name=' + fileName,
                    entry_thumb: null,
                    entry_sidebar: null,
                    entry_default: apiProjectMediaPath + '&format=video&name=' + fileName
                };
                break;
        }
        return mediaObj;
    },

    //any possible answers saved for the current input?
    getMultipleChoiceAnswer (projectExtra, formRef, inputRawAnswer, inputRef, branchInputRef, input) {

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

            //mind: checkbox and search can be an array
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
