import entryParser from 'utils/entry-parser';
import PARAMETERS from 'config/parameters';

const entryGroupParser = {

    getParsedGroupEntriesForDisplay: (projectSlug, formRef, singleEntry, groupInputsRefs, projectExtra, entryUuid, isBranch) => {

        const parsedGroupAnswers = [];

        //get all the group answers as a flat list
        groupInputsRefs.forEach((groupInputRef) => {

            //check if we have an answer, otherwose set it to empty string
            const rawEntry = isBranch ? singleEntry.branch_entry : singleEntry.entry;

            if (rawEntry.answers[groupInputRef]) {
                parsedGroupAnswers.push(...entryParser.getParsedEntryForDisplay(
                    projectSlug,
                    formRef,
                    singleEntry,
                    groupInputRef,
                    projectExtra,
                    entryUuid,
                    isBranch
                ));
            }
            else {
                //skip readme types, as we never get any answer for them, and we are skipping the headers too
                if (projectExtra.inputs[groupInputRef].data.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                    //generate empty answer
                    parsedGroupAnswers.push(entryParser.getEmptyEntryForDisplay(singleEntry));
                }
            }
        });
        return parsedGroupAnswers;
    }
};

export default entryGroupParser;
