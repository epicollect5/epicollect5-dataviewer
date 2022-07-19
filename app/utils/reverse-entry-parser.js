import PARAMETERS from 'config/parameters';
import moment from 'moment';
import helpers from 'utils/helpers';
import Papa from 'papaparse';

//Methods to reverse entries uploaded via csv (bulk upload)
const reverseEntryParser = {

    getEntry(params) {
        //build post object (single entry/branch entry)
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

        //branches upload?
        if (params.currentBranchRef === null) {
            //is this a child form upload? Must add parent form ref and parent entry uuid
            if (params.parentEntryUuid !== null && params.parentFormRef !== null) {
                entry.data.relationships.parent = {
                    data: {
                        parent_form_ref: params.parentFormRef,
                        parent_entry_uuid: params.parentEntryUuid
                    }
                };
            }
        } else {
            //this is a branches upload
            if (params.currentBranchOwnerUuid !== null && params.currentBranchRef !== null) {
                entry.data.relationships.branch = {
                    data: {
                        owner_input_ref: params.currentBranchRef,
                        owner_entry_uuid: params.currentBranchOwnerUuid
                    }
                };
            }
        }

        return entry;
    },

    setEntryJumps(entries, inputs, reverseMapping, currentBranchRef) {

        const self = this;
        const entriesClone = entries.slice(0);
        //hierarchy or branch entry?
        const entryType = currentBranchRef ? 'branch_entry' : 'entry';

        entriesClone.forEach((entry, entryIndex) => {

            let questionsJumpedRefs = new Set([]);

            inputs.forEach((input, inputIndex) => {

                //find out if current input was jumped by a previous one, if it does, skip.
                if (questionsJumpedRefs.has(input.ref)) {
                    return [];
                }

                if (input.jumps.length > 0) {
                    //find if a jump condition is true based on answer given (top to bottom)
                    let key;
                    let entryMapping;
                    let reverseJumps;
                    let jumpedInputsRefs = [];

                    if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                        // const key = reverseMapping.ref2MapTo[input.ref];
                        entryMapping = reverseMapping.reverse['readme_' + input.ref];
                        reverseJumps = entryMapping.reverse_jumps;
                    } else {
                        key = reverseMapping.ref2MapTo[input.ref];
                        entryMapping = reverseMapping.reverse[key];
                        reverseJumps = entryMapping.reverse_jumps;
                    }

                    reverseJumps.some((reverseJump) => {

                        //is this a readme type?
                        if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {

                            //jump for a README can only be "ALL"
                            //we have to jump no matter what
                            const destinationRef = reverseJump.toInputRef;

                            //from current input to jump destination, grab all input refs, they need to be set as jumped
                            jumpedInputsRefs = self.getjumpedInputRefs(inputs, inputIndex, destinationRef);

                            questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                        } else {
                            //if the answer is not provided in the csv (column missing?)
                            //bail out immediately, as it is not a readme
                            if (!entry.data[entryType].answers[input.ref]) {
                                return true;
                            }
                            //get answer by input order
                            const answer = entry.data[entryType].answers[input.ref].answer;

                            switch (reverseJump.when) {
                                case 'IS':
                                    if (helpers.doesAnswerMatchAJump(input, reverseJump, answer, 'IS')) {
                                        //we have to jump
                                        const destinationRef = reverseJump.toInputRef;

                                        //from current input to jump destination, grab all input refs, they need to be set as jumped
                                        jumpedInputsRefs = self.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                                        questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                                    }
                                    break;
                                case 'IS_NOT':
                                    if (helpers.doesAnswerMatchAJump(input, reverseJump, answer, 'IS_NOT')) {
                                        //we have to jump
                                        const destinationRef = reverseJump.toInputRef;

                                        //from current input to jump destination, grab all input refs, they need to be set as jumped
                                        jumpedInputsRefs = self.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                                        questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                                    }
                                    break;
                                case 'ALL': {

                                    //we have to jump no matter what
                                    const destinationRef = reverseJump.toInputRef;

                                    //from current input to jump destination, grab all input refs, they need to be set as jumped
                                    jumpedInputsRefs = self.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                                    questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                                }
                                    break;
                                case 'NO_ANSWER_GIVEN':
                                    //todo check this and also checkboxes and search, '' or [] ????
                                    if (reverseJump.answer_ref === null) {
                                        //we have to jump
                                        const destinationRef = reverseJump.toInputRef;
                                        //from current input to jump destination, grab all input refs, they need to be set as jumped
                                        jumpedInputsRefs = self.getjumpedInputRefs(inputs, inputIndex, destinationRef);
                                        questionsJumpedRefs = new Set([...questionsJumpedRefs, ...jumpedInputsRefs]);
                                    }
                                    break;
                                default:
                                //do nothing
                            }
                        }

                        //if we found a matching jump, exit loop.
                        //Jumps are resolved from top to bottom, first come first serve.
                        return (jumpedInputsRefs.length > 0);
                    }
                    );

                    Object.keys(entry.data[entryType].answers).forEach((inputRef) => {

                        const inputTypesWithAnswerArray = [
                            PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE,
                            PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE,
                            PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE
                        ];

                        //was this question jumped by the form logic?
                        if (questionsJumpedRefs.has(inputRef)) {
                            //ok: this question was jumped by the form logic
                            entriesClone[entryIndex].data[entryType].answers[inputRef].was_jumped = true;

                            //todo: here we need to trigger the error on server side for bulk uploads
                            //todo:because it is not possible to provide values for jumped questions
                            if (inputTypesWithAnswerArray.includes(input.type)) {
                                //above question types get empty array when no answer is provided
                                entriesClone[entryIndex].data[entryType].answers[inputRef].answer = [];
                            } else {
                                //all other question types are empty string when no answer is provided
                                entriesClone[entryIndex].data[entryType].answers[inputRef].answer = '';
                            }
                        }
                    });
                }
            }
            );
        });

        return entriesClone;
    },

    getjumpedInputRefs(inputs, inputIndex, destinationRef) {

        let refs = [];
        let jumpedInputs = [];
        const groupInputRefs = [];

        // console.log('getjumpedInputRefs called by input index ->  ', inputIndex);
        // console.log('getjumpedInputRefs called by input ref ->  ', inputs[inputIndex].ref);
        // console.log('getjumpedInputRefs called by input question ->  ', inputs[inputIndex].question);

        for (let currentIndex = (inputIndex + 1); currentIndex < inputs.length; currentIndex++) {

            //if it is a jump  to the end of the form, grab all the refs
            if (destinationRef === 'END') {

                jumpedInputs = inputs.slice(inputIndex + 1);

                //get refs as plain array from jumped inputs
                refs = jumpedInputs.map((jumpedInput) => {

                    //grab also all the jumped group inputs
                    if (jumpedInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
                        jumpedInput.group.forEach((groupInput) => {
                            groupInputRefs.push(groupInput.ref);
                        });
                    }

                    return jumpedInput.ref;
                });

                break;
                //todo do I need an else with a break?
            } else {
                //grab all the refs till the destination ref
                if (inputs[currentIndex].ref === destinationRef) {
                    //exit as we reach the destination
                    // get the jumped inputs
                    jumpedInputs = inputs.slice(inputIndex + 1, currentIndex);

                    //get refs as plain array from jumped inputs
                    refs = jumpedInputs.map((jumpedInput) => {

                        //grab also all the jumped group inputs
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
        }

        //return both input and group input refs (flatted)
        return refs.concat(groupInputRefs);
    },

    getReverseAnswers(rows, reverseMapping, branches, currentBranchRef, inputsExtra) {

        const reverseAnswers = [];

        const inputRefs = Object.keys(reverseMapping.ref2MapTo);
        let answerRefsForUpload = [];

        /**
         * IMPORTANT: if the file does not have columns for non bulk-uploadable questions
         * we still need to add them to the upload post request as empty answers otherwise
         * it will not go through, triggering the error "Question answer missing"
         * for example audio, photo, video questions
         */

        rows.forEach((row) => {

            const reverseAnswer = {};
            let title = '';
            let hasTitle = false;

            Object.entries(row).forEach((answer) => {

                //remove white spaces or reverse mapping will fail
                const header = answer[0].trim();
                const answerValue = answer[1].trim();
                const question = reverseMapping.reverse[header];

                let accuracy;
                let latitude;
                let longitude;

                //if no question is found, the header was system generated or invalid.
                if (question) {
                    //build title for this entry
                    if (question.is_title) {
                        hasTitle = true;
                        title += answerValue + ' ';
                    }

                    switch (question.type) {

                        //location questions
                        case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:

                            //location question type cannot be set as title
                            if (reverseAnswer[question.input_ref] === undefined) {

                                reverseAnswer[question.input_ref] = {};

                                if (reverseAnswer[question.input_ref].was_jumped === undefined) {
                                    reverseAnswer[question.input_ref].was_jumped = false;
                                }//todo need to handle jumps
                            }

                            if (reverseAnswer[question.input_ref].answer === undefined) {
                                reverseAnswer[question.input_ref].answer = {};
                            }

                            if (header.startsWith('lat_')) {

                                if (answerValue === '') {
                                    reverseAnswer[question.input_ref].answer.latitude = '';
                                } else {
                                    //latitude must be a number
                                    latitude = parseFloat(parseFloat(answerValue).toFixed(6));
                                    if (Number.isNaN(latitude)) {
                                        reverseAnswer[question.input_ref].answer.latitude = null;
                                    } else {
                                        reverseAnswer[question.input_ref].answer.latitude = latitude;
                                    }
                                }
                            }

                            if (header.startsWith('long_')) {
                                if (answerValue === '') {
                                    reverseAnswer[question.input_ref].answer.longitude = '';
                                } else {

                                    //longitude must be a number
                                    longitude = parseFloat(parseFloat(answerValue).toFixed(6));
                                    if (Number.isNaN(longitude)) {
                                        reverseAnswer[question.input_ref].answer.longitude = null;
                                    } else {
                                        reverseAnswer[question.input_ref].answer.longitude = longitude;
                                    }
                                }
                            }

                            if (header.startsWith('accuracy_')) {
                                if (answerValue === '') {
                                    reverseAnswer[question.input_ref].answer.accuracy = '';
                                } else {

                                    //accuracy must be a positive integer
                                    accuracy = parseInt(answerValue, 10);

                                    if (Number.isNaN(accuracy)) {
                                        reverseAnswer[question.input_ref].answer.accuracy = null;
                                    } else {
                                        reverseAnswer[question.input_ref].answer.accuracy = accuracy;
                                    }

                                }
                            }
                            break;

                        //open answers questions
                        case PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_INTEGER_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_DECIMAL_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_PHONE_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_TEXTAREA_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_BARCODE_TYPE:
                            //this is an open text question
                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
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
                                    //date formats
                                    case PARAMETERS.DATE_FORMAT_1:
                                        // DATE_FORMAT_1:    'dd/MM/YYYY',
                                        //"2014-09-08T00:00:000Z"
                                        dateAnswer = parts[2] + '-' + parts[1] + '-' + parts[0];
                                        break;
                                    case PARAMETERS.DATE_FORMAT_2:
                                        // DATE_FORMAT_2: 'MM/dd/YYYY',
                                        dateAnswer = parts[2] + '-' + parts[0] + '-' + parts[1];
                                        break;
                                    case PARAMETERS.DATE_FORMAT_3:
                                        // DATE_FORMAT_3: 'YYYY/MM/dd',
                                        dateAnswer = parts[0] + '-' + parts[1] + '-' + parts[2];
                                        break;
                                    case PARAMETERS.DATE_FORMAT_4:
                                        // DATE_FORMAT_4: 'MM/YYYY',
                                        //day is not provided so we hard code "01"
                                        dateAnswer = parts[1] + '-' + parts[0] + '-01';
                                        break;
                                    case PARAMETERS.DATE_FORMAT_5:
                                        // DATE_FORMAT_5: 'dd/MM'
                                        //year is not provided so we hard code the current year
                                        dateAnswer = (new Date()).getUTCFullYear() + '-' + parts[1] + '-' + parts[0];
                                        break;
                                    default:
                                    //do nothing
                                }
                                //1977-05-22T00:00:00.000
                                dateAnswer += 'T00:00:00.000';//hardcoding time;
                            }

                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                answer: dateAnswer
                            };

                            break;
                        }
                        case PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE: {
                            let timeAnswer;
                            let parts;
                            const today = new Date();
                            const year = today.getUTCFullYear();
                            const month = ('0' + (today.getUTCMonth() + 1)).slice(-2);
                            const day = ('0' + today.getUTCDay()).slice(-2);

                            if (answerValue === '') {
                                timeAnswer = '';
                            } else {
                                parts = answerValue.split(':');
                                switch (question.datetime_format) {
                                    //datetime formats
                                    case PARAMETERS.TIME_FORMAT_1:
                                        // TIME_FORMAT_1: 'HH:mm:ss',
                                        //"2014-09-08T00:00:00.000"
                                        timeAnswer = parts[0] + ':' + parts[1] + ':' + parts[2];
                                        break;
                                    case PARAMETERS.TIME_FORMAT_2:
                                        //     TIME_FORMAT_2: 'hh:mm:ss',
                                        timeAnswer = parts[0] + ':' + parts[1] + ':' + parts[2];
                                        break;
                                    case PARAMETERS.TIME_FORMAT_3:
                                        //TIME_FORMAT_3: 'HH:mm',
                                        timeAnswer = parts[0] + ':' + parts[1] + ':00';
                                        break;
                                    case PARAMETERS.TIME_FORMAT_4:
                                        // TIME_FORMAT_4: 'hh:mm',
                                        timeAnswer = parts[0] + ':' + parts[1] + ':00';
                                        break;
                                    case PARAMETERS.TIME_FORMAT_5:
                                        // TIME_FORMAT_5: 'mm:ss',
                                        timeAnswer = '00:' + parts[1] + ':' + parts[0];
                                        break;
                                    default:
                                    //do nothing
                                }
                                timeAnswer = year + '-' + month + '-' + day + 'T' + timeAnswer + '.000';
                            }

                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                answer: timeAnswer
                            };
                            break;
                        }

                        //multiple choice questions (single choice only)
                        case PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_DROPDOWN_TYPE: {

                            let mappedAnswer = '';

                            if (answerValue !== '') {
                                const answerRef = question.reverse_possible_answers[answerValue];
                                /**
                                 * If no answer_ref is found, it means the value does not
                                 * match any of the possible answers, so set it to the current answer value
                                 * to trigger a "Value invalid" error in the api response
                                 * We also do this to be able to display the wrong answer value
                                 * when showing failed entries only in the table
                                 */
                                mappedAnswer = answerRef || answerValue;
                            }

                            //need to reverse map answer to anwer_ref
                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                //if the possibleAnswer is undefined, we pass null to trigger server side validation
                                //this happens when a value in the csv does not match any of the possible answers mapping
                                answer: mappedAnswer
                            };
                            break;
                        }
                        case PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_SEARCH_SINGLE_TYPE:
                        case PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE: {
                            //checkbox and search can have multiple answers so let's map each answer to its answer ref and build array.
                            const answerRefs = [];


                            if (answerValue !== '') {

                                //remove whitespaces after commas beofre quotes for proper splitting
                                //of values with commas -> like, "for, example, this", value
                                //see https://github.com/mholt/PapaParse/issues/222#issuecomment-113608557
                                const answerValueSanitised = answerValue.replace(/\s*, "\s*/g, ',"');

                                /**
                                 *Parsing csv values, handling commas and quotes
                                 as per csv specs https://datatracker.ietf.org/doc/html/rfc4180
                                 */
                                const parsedAnswer = Papa.parse(answerValueSanitised, {
                                    delimiter: ',',
                                    transform: (el) => { return el.trim(); }
                                });

                                parsedAnswer.data[0].forEach((el) => {
                                    //if the possibleAnswer is undefined, we pass null to trigger server side validation
                                    //this happens when a value in the csv does not match any of the possible answers mapping

                                    //We add the '-' to trigger an error (for checkboxes mainly, as the server does not check if a value does not match current possible answers)
                                    answerRefs.push(question.reverse_possible_answers[el] || '-' + el + '-');
                                });
                            }

                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                answer: answerRefs
                            };

                            break;
                        }

                        case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE:
                            //this question type is not bulk uploadable so set "answer" to ''
                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                answer: ''
                            };
                            break;

                        default:
                            //this question type is not bulk uploadable so set "answer" to ''
                            reverseAnswer[question.input_ref] = {
                                was_jumped: false, //todo need to handle jumps
                                answer: ''
                            };
                    }
                }
            }
            );

            if (Object.keys(reverseAnswer).length === 0) {
                //the file does not have a single header matching, probably wrong mapping so bail out
                //todo
            }

            //any media types? Need to add the empty answer for the post upload
            answerRefsForUpload = Object.keys(reverseAnswer);
            const difference = inputRefs.filter((d) => {
                return !answerRefsForUpload.includes(d);
            });

            if (difference.length > 0) {
                difference.forEach((inputRef) => {
                    console.log('input skipped is type ->  ', inputsExtra[inputRef].data.type);
                    if (PARAMETERS.MEDIA_TYPES.indexOf(inputsExtra[inputRef].data.type) > -1) {
                        reverseAnswer[inputRef] = {
                            was_jumped: false,
                            answer: ''
                        };
                    }
                });
            }

            /** Are there any branches?
             * we artificially add an empty branch answer per each branch, as they are not part of the headers in
             * the upload template but the api needs them in the request object for the upload to be successfull
             * also for consistency with the mobile app which does the same.
             */
            if (branches.length > 0) {
                branches.forEach((branchRef) => {
                    //this question type is not bulk uploadable so set "answer" to ''
                    reverseAnswer[branchRef] = {
                        was_jumped: false, //todo need to handle jumps
                        answer: ''
                    };
                });
            }

            if (currentBranchRef) {
                reverseAnswers.push({
                    answer: reverseAnswer,
                    title: hasTitle ? title : null,
                    uuid: row.ec5_branch_uuid === '' ? null : row.ec5_branch_uuid
                });
            } else {
                reverseAnswers.push({
                    answer: reverseAnswer,
                    title: hasTitle ? title : null,
                    uuid: row.ec5_uuid === '' ? null : row.ec5_uuid
                });
            }
        });

        return reverseAnswers;
    },

    getReverseMapping(currentFormRef, currentFormMapping, projectExtra, projectDefinition, currentBranchRef) {

        //build hash map inputRef: mapTo for quick look ups
        const reverseMapping = {};
        //map ref to map_to for quicker look ups
        const mappingHashMap = {};

        let currentBranchInputIndex;
        let inputs;

        Object.entries(currentFormMapping).forEach((value) => {

            const inputRef = value[0];
            const input = projectExtra.inputs[inputRef].data;
            const possibleAnswers = {};

            let mapTo;

            switch (input.type) {
                //handle location type, split over multiple column headers
                case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
                    mapTo = 'lat_' + value[1].map_to;
                    reverseMapping[mapTo] = value[1];
                    reverseMapping[mapTo].input_ref = inputRef;
                    reverseMapping[mapTo].type = input.type;

                    mapTo = 'long_' + value[1].map_to;
                    reverseMapping[mapTo] = value[1];
                    reverseMapping[mapTo].input_ref = inputRef;
                    reverseMapping[mapTo].type = input.type;

                    mapTo = 'accuracy_' + value[1].map_to;
                    reverseMapping[mapTo] = value[1];
                    reverseMapping[mapTo].input_ref = inputRef;
                    reverseMapping[mapTo].type = input.type;
                    break;

                //split group
                case PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE:

                    //add map for group
                    mapTo = value[1].map_to;
                    reverseMapping[mapTo] = value[1];
                    reverseMapping[mapTo].input_ref = inputRef;
                    reverseMapping[mapTo].type = input.type;
                    //reverseMapping[mapTo].possible_answers = {};

                    mappingHashMap[inputRef] = value[1].map_to;

                    //add map per each group input (flatting structure out)
                    Object.entries(value[1].group).forEach((groupValue) => {

                        const groupInputRef = groupValue[0];
                        const groupInput = projectExtra.inputs[groupInputRef].data;
                        // const ownerInput =
                        const groupInputPossibleAnswers = {};

                        let groupMapTo;
                        switch (groupInput.type) {

                            //handle location type, split over multiple column headers
                            case PARAMETERS.INPUT_TYPES.EC5_LOCATION_TYPE:
                                groupMapTo = 'lat_' + groupValue[1].map_to;
                                reverseMapping[groupMapTo] = groupValue[1];
                                reverseMapping[groupMapTo].input_ref = groupInputRef;
                                reverseMapping[groupMapTo].type = groupInput.type;

                                groupMapTo = 'long_' + groupValue[1].map_to;
                                reverseMapping[groupMapTo] = groupValue[1];
                                reverseMapping[groupMapTo].input_ref = groupInputRef;
                                reverseMapping[groupMapTo].type = groupInput.type;

                                groupMapTo = 'accuracy_' + groupValue[1].map_to;
                                reverseMapping[groupMapTo] = groupValue[1];
                                reverseMapping[groupMapTo].input_ref = groupInputRef;
                                reverseMapping[groupMapTo].type = groupInput.type;
                                break;

                            case PARAMETERS.INPUT_TYPES.EC5_BRANCH_TYPE:

                                // mapTo = value[1].map_to;
                                // reverseMapping[mapTo] = value[1];
                                // reverseMapping[mapTo].input_ref = inputRef;
                                // reverseMapping[mapTo].type = input.type;
                                // mappingHashMap[inputRef] = value[1].map_to;

                                break;

                            default:
                                groupMapTo = groupValue[1].map_to;
                                reverseMapping[groupMapTo] = groupValue[1];
                                reverseMapping[groupMapTo].input_ref = groupInputRef;
                                reverseMapping[groupMapTo].type = groupInput.type;
                                //reverseMapping[mapTo].possible_answers = {};

                                if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(groupInput.type) !== -1) {
                                    //need to reverse map answer to answer_ref
                                    Object.entries(groupValue[1].possible_answers).forEach((possibleAnswer) => {
                                        groupInputPossibleAnswers[(possibleAnswer[1].map_to).trim()] = possibleAnswer[0];
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

                    // mapTo = value[1].map_to;
                    // reverseMapping[mapTo] = value[1];
                    // reverseMapping[mapTo].input_ref = inputRef;
                    // reverseMapping[mapTo].type = input.type;
                    // mappingHashMap[inputRef] = value[1].map_to;

                    break;

                default:
                    mapTo = value[1].map_to;
                    reverseMapping[mapTo] = value[1];
                    reverseMapping[mapTo].input_ref = inputRef;
                    reverseMapping[mapTo].type = input.type;
                    //reverseMapping[mapTo].possible_answers = {};

                    if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(input.type) !== -1) {
                        //need to reverse map answer to answer_ref
                        Object.entries(value[1].possible_answers).forEach((possibleAnswer) => {
                            possibleAnswers[(possibleAnswer[1].map_to).trim()] = possibleAnswer[0];
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

        //reverse map the jumps
        const forms = projectDefinition.project.forms;
        const currentFormIndex = helpers.getFormIndexFromRef(forms, currentFormRef);

        //are we mapping a branch input?
        if (currentBranchRef !== null) {
            currentBranchInputIndex = helpers.getBranchInputIndexFromRef(forms[currentFormIndex].inputs, currentBranchRef);
            inputs = forms[currentFormIndex].inputs[currentBranchInputIndex].branch;
        } else {
            inputs = forms[currentFormIndex].inputs;
        }

        inputs.forEach((input) => {

            const reverseEntryMapping = reverseMapping[mappingHashMap[input.ref]];
            const reverseJumps = [];

            // console.log('reverseMapping', JSON.stringify(reverseMapping));
            // console.log('mappingHashMap', JSON.stringify(mappingHashMap));
            // console.log(input.ref);

            /**
             * If there are any jumps, they need to be reverse mapped
             * Media types, branch and group could have the jump "All"
             * if they are the destination of other jumps, so they need to be mapped as well.
             * Anyway, these types cannot be required so jumping it or not
             * does not make any difference to the validation (is_jumped can be true or false regardless)
             * since we are uploading an empty "" answer.
             */

            //If there are any jumps, map them skipping readme type
            //which does not request an answer
            //   if (input.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
            if (input.jumps.length > 0) {

                input.jumps.forEach((jump) => {

                    if (jump.answer_ref === null) {

                        //always jump?
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

                //README are not mapped so handle those with input ref
                if (input.type === PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                    reverseMapping['readme_' + input.ref] = {};
                    reverseMapping['readme_' + input.ref].reverse_jumps = reverseJumps;
                } else {
                    reverseMapping[mappingHashMap[input.ref]].reverse_jumps = reverseJumps;
                }
            }
        });

        return { reverse: reverseMapping, ref2MapTo: mappingHashMap };
    }
};

export default reverseEntryParser;
