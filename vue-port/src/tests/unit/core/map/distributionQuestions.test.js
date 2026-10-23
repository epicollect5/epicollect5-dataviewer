import { buildDistributionQuestions } from '@/core/map/distributionQuestions';

describe('core/map/distributionQuestions', () => {
  const projectExtra = {
    forms: {
      form_1: {
        lists: {
          multiple_choice_inputs: {
            form: {
              order: ['choice_1', 'choice_2'],
              choice_1: {
                possible_answers: {
                  answer_1: 'Yes'
                }
              },
              choice_2: {
                possible_answers: {}
              }
            },
            branch: {
              branch_1: {
                choice_1: {
                  possible_answers: {
                    answer_9: 'Maybe'
                  }
                }
              }
            }
          }
        }
      }
    },
    inputs: {
      choice_1: {
        data: {
          question: 'Choice'
        }
      },
      choice_2: {
        data: {
          question: 'Empty choice'
        }
      }
    }
  };

  it('keeps only the form inputs that expose possible answers', () => {
    const questions = buildDistributionQuestions({
      projectExtra,
      currentFormRef: 'form_1',
      selectedBranchRef: ''
    });

    expect(questions).toEqual([
      {
        inputRef: 'choice_1',
        question: 'Choice',
        possibleAnswersHashMap: {
          answer_1: 'Yes'
        }
      }
    ]);
  });

  it('reads the branch inputs when a branch is selected', () => {
    const questions = buildDistributionQuestions({
      projectExtra,
      currentFormRef: 'form_1',
      selectedBranchRef: 'branch_1'
    });

    expect(questions).toEqual([
      {
        inputRef: 'choice_1',
        question: 'Choice',
        possibleAnswersHashMap: {
          answer_9: 'Maybe'
        }
      }
    ]);
  });

  it('returns an empty list when the form has no multiple choice inputs', () => {
    const questions = buildDistributionQuestions({
      projectExtra: { forms: {}, inputs: {} },
      currentFormRef: 'form_1',
      selectedBranchRef: ''
    });

    expect(questions).toEqual([]);
  });
});
