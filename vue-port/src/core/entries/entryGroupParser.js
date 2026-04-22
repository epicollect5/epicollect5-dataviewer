import PARAMETERS from '@/core/config/parameters';
import entryParser from '@/core/entries/entryParser';

const entryGroupParser = {
  getParsedGroupEntriesForDisplay(
    projectSlug,
    formRef,
    singleEntry,
    groupInputsRefs,
    projectExtra,
    entryUuid,
    isBranch
  ) {
    const parsedGroupAnswers = [];

    groupInputsRefs.forEach((groupInputRef) => {
      const rawEntry = isBranch ? singleEntry.branch_entry : singleEntry.entry;

      if (rawEntry.answers[groupInputRef]) {
        parsedGroupAnswers.push(
          ...entryParser.getParsedEntryForDisplay(
            projectSlug,
            formRef,
            singleEntry,
            groupInputRef,
            projectExtra,
            entryUuid,
            isBranch
          )
        );
      } else if (projectExtra.inputs[groupInputRef].data.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
        parsedGroupAnswers.push(entryParser.getEmptyEntryForDisplay(singleEntry));
      }
    });

    return parsedGroupAnswers;
  }
};

export default entryGroupParser;
