import fecha from 'fecha';
import PARAMETERS from '@/core/config/parameters';
import entryParser from '@/core/entries/entryParser';
import entryGroupParser from '@/core/entries/entryGroupParser';

const tableModel = {
  getFixedHeaders(entryChildrenCount, entryTitle, entryCreatedAt, entryUuid, singleEntryFlat, isBranch) {
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
      },
      {
        inputType: PARAMETERS.INPUT_TYPES.TEXT,
        cellType: 'CellText',
        answer: fecha.format(new Date(entryCreatedAt), 'Do MMM, YYYY'),
        entryUuid,
        singleEntryFlat: null
      }
    ];

    if (isBranch) {
      fixedHeaders.splice(PARAMETERS.TABLE_FIXED_HEADERS_CHILDREN_INDEX, 1);
    }

    return fixedHeaders;
  },

  getHeaders(projectExtra, formRef) {
    const formFlatInputsList = projectExtra.forms[formRef];
    const columnHeaders = [];

    formFlatInputsList.inputs.forEach((inputRef) => {
      let currentInput = projectExtra.inputs[inputRef].data;

      if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
        const groupInputsRefs = formFlatInputsList.group[inputRef];
        groupInputsRefs.forEach((groupInputRef) => {
          currentInput = projectExtra.inputs[groupInputRef].data;
          if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
            columnHeaders.push({ groupInputRef, question: currentInput.question });
          }
        });
      } else if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
        columnHeaders.push({ inputRef, question: currentInput.question });
      }
    });

    return columnHeaders;
  },

  getBranchHeaders(projectExtra, formRef, branchInputRef) {
    const branchInputsList = projectExtra.forms[formRef].branch[branchInputRef];
    const columnHeaders = [];

    branchInputsList.forEach((inputRef) => {
      let currentInput = projectExtra.inputs[inputRef].data;

      if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
        const groupInputsRefs = projectExtra.forms[formRef].group[inputRef];
        groupInputsRefs.forEach((groupInputRef) => {
          currentInput = projectExtra.inputs[groupInputRef].data;
          if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
            columnHeaders.push({ groupInputRef, question: currentInput.question });
          }
        });
      } else if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
        columnHeaders.push({ inputRef, question: currentInput.question });
      }
    });

    return columnHeaders;
  },

  getRows(projectSlug, projectExtra, formRef, entriesExtra, branchInputRef) {
    const formFlatInputsList = projectExtra.forms[formRef];
    const entries = entriesExtra.data.entries;
    const entryRows = [];

    entries.forEach((singleEntry) => {
      const singleEntryFlat = [];
      const currentEntry = branchInputRef ? singleEntry.branch_entry : singleEntry.entry;
      const entryUuid = currentEntry.entry_uuid;
      const entryTitle = currentEntry.title;
      const entryCreatedAt = currentEntry.created_at;
      const entryChildrenCount = singleEntry.attributes.child_counts === null ? 0 : singleEntry.attributes.child_counts;
      const inputList = branchInputRef ? formFlatInputsList.branch[branchInputRef] : formFlatInputsList.inputs;

      inputList.forEach((inputRef) => {
        const currentInput = projectExtra.inputs[inputRef].data;

        if (currentEntry.answers[inputRef]) {
          singleEntryFlat.push(
            ...entryParser.getParsedEntryForDisplay(
              projectSlug,
              formRef,
              singleEntry,
              inputRef,
              projectExtra,
              entryUuid,
              branchInputRef
            )
          );
          return;
        }

        if (currentInput.type === PARAMETERS.INPUT_TYPES.EC5_GROUP_TYPE) {
          const groupInputsRefs = formFlatInputsList.group[inputRef];

          singleEntryFlat.push(
            ...entryGroupParser.getParsedGroupEntriesForDisplay(
              projectSlug,
              formRef,
              singleEntry,
              groupInputsRefs,
              projectExtra,
              entryUuid,
              branchInputRef
            )
          );
          return;
        }

        if (currentInput.type !== PARAMETERS.INPUT_TYPES.EC5_README_TYPE) {
          singleEntryFlat.push(entryParser.getEmptyEntryForDisplay(singleEntry));
        }
      });

      const fixedCells = tableModel.getFixedHeaders(
        entryChildrenCount,
        entryTitle,
        entryCreatedAt,
        entryUuid,
        singleEntryFlat,
        branchInputRef
      );

      singleEntryFlat.unshift(...fixedCells);
      entryRows.push(singleEntryFlat);
    });

    return entryRows;
  },

  getChildFormRef(forms, currentFormRef) {
    for (let index = 0; index < forms.length; index += 1) {
      if (forms[index].ref === currentFormRef) {
        if (index !== forms.length) {
          return forms[index + 1].ref;
        }
      }
    }

    return false;
  },

  getParentFormRef(forms, currentFormRef) {
    for (let index = 0; index < forms.length; index += 1) {
      if (forms[index].ref === currentFormRef) {
        if (index !== forms.length) {
          return forms[index - 1].ref;
        }
      }
    }

    return false;
  }
};

export default tableModel;
