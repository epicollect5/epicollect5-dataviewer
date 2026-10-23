const getMultipleChoiceInputRefs = (inputHashMap) => {
  if (!inputHashMap) {
    return [];
  }

  if (Array.isArray(inputHashMap.order)) {
    return inputHashMap.order;
  }

  return Object.keys(inputHashMap).filter((inputRef) => inputRef !== 'order');
};

export const getDistributionInputHashMap = ({ multipleChoiceInputs, selectedBranchRef }) => {
  if (selectedBranchRef) {
    return multipleChoiceInputs?.branch?.[selectedBranchRef] || {};
  }

  return multipleChoiceInputs?.form || {};
};

export const buildDistributionQuestions = ({ projectExtra, currentFormRef, selectedBranchRef }) => {
  const currentForm = projectExtra?.forms?.[currentFormRef];
  const multipleChoiceInputs = currentForm?.lists?.multiple_choice_inputs;
  const inputHashMap = getDistributionInputHashMap({
    multipleChoiceInputs,
    selectedBranchRef
  });

  return getMultipleChoiceInputRefs(inputHashMap)
    .map((inputRef) => ({
      inputRef,
      question: projectExtra?.inputs?.[inputRef]?.data?.question || inputRef,
      possibleAnswersHashMap: inputHashMap?.[inputRef]?.possible_answers || {}
    }))
    .filter((question) => Object.keys(question.possibleAnswersHashMap).length > 0);
};
