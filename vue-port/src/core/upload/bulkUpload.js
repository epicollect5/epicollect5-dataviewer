import PARAMETERS from '@/core/config/parameters';
import formatters from '@/core/datetime/formatters';

const bulkUpload = {
  getFailedOriginalAnswer(input, entryMapping, currentEntry, entryType) {
    let originalAnswer = currentEntry.data[entryType].answers[input.ref].answer;

    if (input.type === PARAMETERS.INPUT_TYPES.EC5_DATE_TYPE) {
      originalAnswer = formatters.getFormattedDate(originalAnswer, input.datetime_format);
    }
    if (input.type === PARAMETERS.INPUT_TYPES.EC5_TIME_TYPE) {
      originalAnswer = formatters.getFormattedTime(originalAnswer, input.datetime_format);
    }

    if (PARAMETERS.MULTIPLE_ANSWERS_TYPES.indexOf(input.type) > -1) {
      if (PARAMETERS.MULTIPLE_ANSWERS_TYPES_AS_ARRAY.indexOf(input.type) > -1) {
        const answerRefs = currentEntry.data[entryType].answers[input.ref].answer;
        const values = [];
        originalAnswer = [];

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
        const answerRef = currentEntry.data[entryType].answers[input.ref].answer;
        if (answerRef === '') {
          originalAnswer = '';
        } else if (entryMapping.possible_answers[answerRef]) {
          originalAnswer = entryMapping.possible_answers[answerRef].map_to;
        } else {
          originalAnswer = answerRef;
        }
      }
    }

    return originalAnswer;
  }
};

export default bulkUpload;
