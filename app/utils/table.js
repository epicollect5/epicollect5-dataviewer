import fecha from 'fecha';
import PARAMETERS from 'config/parameters';
import entryParser from 'utils/entry-parser';
import entryGroupParser from 'utils/entry-group-parser';

const table = {

    getFixedHeaders: (entryChildrenCount, entryTitle, entryCreatedAt, entryUuid, singleEntryFlat, isBranch) => {

        const fixedHeaders = [
            {
                inputType: null,
                cellType: 'CellView',
                answer: null,
                entryUuid,
                singleEntryFlat
            },
            {
                inputType: null,
                cellType: 'CellDelete',
                answer: null,
                entryUuid,
                singleEntryFlat: null
            },
            {
                inputType: null,
                cellType: 'CellEdit',
                answer: null,
                entryUuid,
                singleEntryFlat: null
            },
            {
                inputType: null,
                cellType: 'CellChildren',
                answer: entryChildrenCount,
                entryUuid,
                singleEntryFlat: null
            },
            {
                inputType: PARAMETERS.INPUT_TYPES.TEXT,
                cellType: 'CellText',
                answer: entryTitle,
                entryUuid,
                singleEntryFlat: null

            }, {
                inputType: PARAMETERS.INPUT_TYPES.TEXT,
                cellType: 'CellText',
                answer: fecha.format(new Date(entryCreatedAt), 'Do MMM, YYYY'), //i.e '20th Nov, 2015'
                entryUuid,
                singleEntryFlat: null
            }
        ];

        //if it is a branch, remove the "children" column
        if (isBranch) {
            fixedHeaders.splice(PARAMETERS.TABLE_FIXED_HEADERS_CHILDREN_INDEX, 1);
        }
        return fixedHeaders;
    },

    getHeaders: (projectExtra, formRef) => {
        const formFlatInputsList = projectExtra.forms[formRef];
        const columnHeaders = [];

        //todo loop is the same as getEntriesRows, improve this!
        formFlatInputsList.inputs.forEach((inputRef) => {

            let currentInput = projectExtra.inputs[inputRef].data;

            //is it a group?
            if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
                //get all group inputs to be shown as top level inputs (we do not create a subheader for them)

                const groupInputsRefs = formFlatInputsList.group[inputRef];
                groupInputsRefs.forEach((groupInputRef) => {
                    currentInput = projectExtra.inputs[groupInputRef].data;

                    //skip readme types
                    if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                        //push input question as column header
                        columnHeaders.push({ groupInputRef, question: currentInput.question });
                    }
                });
            } else {
                //skip readme types
                if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                    //push input question as column header
                    columnHeaders.push({ inputRef, question: currentInput.question });
                }
            }
        });

        return columnHeaders;
    },

    getBranchHeaders: (projectExtra, formRef, branchInputRef) => {
        const branchInputsList = projectExtra.forms[formRef].branch[branchInputRef];
        const columnHeaders = [];

        //todo loop is the same as getEntriesRows, improve this!
        branchInputsList.forEach((inputRef) => {

            let currentInput = projectExtra.inputs[inputRef].data;

            //is it a group?
            if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
                //get all group inputs to be shown as top level inputs (we do not create a subheader for them)

                const groupInputsRefs = projectExtra.forms[formRef].group[inputRef];
                groupInputsRefs.forEach((groupInputRef) => {
                    currentInput = projectExtra.inputs[groupInputRef].data;
                    //push group input question as column header

                    //skip readme types
                    if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                        columnHeaders.push({ groupInputRef, question: currentInput.question });
                    }
                });
            } else {
                //skip readme types
                if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                    //push input question as column header
                    columnHeaders.push({ inputRef, question: currentInput.question });
                }
            }
        });

        return columnHeaders;
    },

    getRows: (projectSlug, projectExtra, formRef, entriesExtra, branchInputRef) => {

        const formFlatInputsList = projectExtra.forms[formRef];
        const entries = entriesExtra.data.entries;
        const entrieRows = [];

        entries.forEach((singleEntry) => {

            const singleEntryFlat = [];
            let fixedCells = [];

            //work with entries or branch entries
            const currentEntry = branchInputRef ? singleEntry.branch_entry : singleEntry.entry;
            const entryUuid = currentEntry.entry_uuid;
            const entryTitle = currentEntry.title;
            const entryCreatedAt = currentEntry.created_at;
            const entryChildrenCount = singleEntry.attributes.child_counts === null ? 0 : singleEntry.attributes.child_counts;
            const inputList = branchInputRef ? formFlatInputsList.branch[branchInputRef] : formFlatInputsList.inputs;

            //loop main input list i.e. the actual active questions, in order, like listed by the formbuilder
            inputList.forEach((inputRef) => {

                const currentInput = projectExtra.inputs[inputRef].data;

                //do we have an answer for the current inputRef?
                if (currentEntry.answers[inputRef]) {
                    //it does, add it to flat list
                    singleEntryFlat.push(...entryParser.getParsedEntryForDisplay(
                        projectSlug,
                        formRef,
                        singleEntry,
                        inputRef,
                        projectExtra,
                        entryUuid,
                        branchInputRef
                    ));
                    return;
                }

                //got here? => answer could be missing or it could be a group input!!!!
                //This happens when questions are  added/remove from the project definition, or when the question is a group
                if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {

                    //add answer for each group input, as we are flatten them
                    const groupInputsRefs = formFlatInputsList.group[inputRef];

                    //push group input questions as column headers
                    singleEntryFlat.push(...entryGroupParser.getParsedGroupEntriesForDisplay(
                        projectSlug,
                        formRef,
                        singleEntry,
                        groupInputsRefs,
                        projectExtra,
                        entryUuid,
                        branchInputRef
                    ));
                    return;
                }

                //got here? -> single empty answer (skip README type)
                if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
                    singleEntryFlat.push(entryParser.getEmptyEntryForDisplay(singleEntry));
                }
            });

            fixedCells = table.getFixedHeaders(entryChildrenCount, entryTitle, entryCreatedAt, entryUuid, singleEntryFlat, branchInputRef);

            //prepend fixed cells, the are rendered on the left as fixed
            singleEntryFlat.unshift(...fixedCells);

            entrieRows.push(singleEntryFlat);
        }
        );
        return entrieRows;
    },

    //todo we can improve but the loop is on 5 elements max....
    getChildFormRef: (forms, currentFormRef) => {
        for (let i = 0, len = forms.length; i < len; i++) {
            if (forms[i].ref === currentFormRef) {
                if (i !== len) {
                    return forms[i + 1].ref;
                }
            }
        }
        //return false when there is not a next formRef
        return false;
    },

    //todo we can improve but the loop is on 5 elements max....
    getParentFormRef: (forms, currentFormRef) => {
        for (let i = 0, len = forms.length; i < len; i++) {
            if (forms[i].ref === currentFormRef) {
                if (i !== len) {
                    return forms[i - 1].ref;
                }
            }
        }
        //return false when there is not a next formRef
        return false;

    }
};

export default table;

