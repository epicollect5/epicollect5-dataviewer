import PARAMETERS from 'config/parameters';
import datetime from 'utils/datetime';

const bulkUpload = {

    getFailedOriginalAnswer(input, entryMapping, currentEntry, entryType) {

        //get original answer from current entry
        let originalAnswer = currentEntry.data[entryType].answers[input.ref].answer;

        //re-format date and time question types (as they are originally in iso format)
        if (input.type === PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE) {
            originalAnswer = datetime.getFormattedDate(originalAnswer, input.datetime_format);
        }
        if (input.type === PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE) {
            originalAnswer = datetime.getFormattedTime(originalAnswer, input.datetime_format);
        }

        //multiple choice answers require the answer_ref to be mapped back to its value
        if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(input.type) > -1) {

            if (PARAMETERS.MULTIPLE_ANSWERS_TYPES_AS_ARRAY.indexOf(input.type) > -1) {
                //Here we have checkbox, searchsingle, searchmultiple.
                //Answer is always an array of refs (or wrong values wrapped in '-')
                const answerRefs = currentEntry.data[entryType].answers[input.ref].answer;
                const values = [];
                originalAnswer = [];

                //todo: is this possible?
                if (answerRefs === '') {
                    originalAnswer = '';
                } else {

                    answerRefs.forEach((answerRef) => {
                        if (entryMapping.possible_answers[answerRef]) {
                            values.push(entryMapping.possible_answers[answerRef].map_to);
                        } else {
                            values.push(answerRef.slice(1, -1));
                        }
                    });

                    originalAnswer = values.join(', ');
                }
            } else {
                //here we have dropdown and radio
                const answerRef = currentEntry.data[entryType].answers[input.ref].answer;
                if (answerRef === '') {
                    originalAnswer = '';
                } else {
                    if (entryMapping.possible_answers[answerRef]) {
                        originalAnswer = entryMapping.possible_answers[answerRef].map_to;
                    } else {
                        originalAnswer = answerRef;
                    }
                }
            }
        }

        return originalAnswer;
    }
};

export default bulkUpload;
