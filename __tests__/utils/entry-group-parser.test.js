import entryGroupParser from 'utils/entry-group-parser';
import PARAMETERS from 'config/parameters';
import { getProjectExtra, FORM_REF, BRANCH_REF } from '../fixtures/projectExtra';
import { getEntry, getBranchEntry } from '../fixtures/entries';

const projectExtra = getProjectExtra();
const projectSlug = 'a-project';
const entryUuid = 'entry-uuid-1';

const entry = getEntry();

const parseGroup = (groupInputsRefs, currentEntry, isBranch) => {
    return entryGroupParser.getParsedGroupEntriesForDisplay(
        projectSlug,
        FORM_REF,
        currentEntry || entry,
        groupInputsRefs,
        projectExtra,
        entryUuid,
        isBranch
    );
};

const groupRefs = projectExtra.forms[FORM_REF].group['group-ref'];
const group2Refs = projectExtra.forms[FORM_REF].group['group2-ref'];

describe('entry group parser utils test', () => {

    it('should parse the answered members of a group', () => {
        const parsed = parseGroup(groupRefs);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].inputRef).toBe('group-text-ref');
        expect(parsed[0].answer).toBe('a group text answer');
        expect(parsed[0].inputType).toBe(PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE);
    });

    it('should skip a missing member of readme type', () => {
        //'group-readme-ref' has no answer and is a readme, so it is skipped
        const parsed = parseGroup(groupRefs);

        expect(parsed).toHaveLength(1);
        expect(parsed.map((item) => item.inputRef)).not.toContain('group-readme-ref');
    });

    it('should return an empty answer for a missing member that is not a readme', () => {
        //'group2-text-ref' has no answer and is not a readme
        const parsed = parseGroup(group2Refs);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].inputType).toBe(PARAMETERS.INPUT_TYPES.TEXT);
        expect(parsed[0].cellType).toBe(PARAMETERS.CEll_TYPES.TEXT);
        expect(parsed[0].answer).toBe('');
    });

    it('should parse an answered member and an empty member of the same group', () => {
        const partiallyAnsweredEntry = getEntry({
            entry: {
                answers: {
                    'group2-text-ref': {
                        answer: 'an answer',
                        was_jumped: false
                    }
                }
            }
        });

        const parsed = parseGroup(group2Refs, partiallyAnsweredEntry);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].answer).toBe('an answer');
    });

    it('should read the branch entry when the group is on a branch', () => {
        const branchRow = {
            ...getEntry(),
            branch_entry: {
                ...getBranchEntry(),
                answers: {
                    'branch-text-ref': {
                        answer: 'a branch text answer',
                        was_jumped: false
                    }
                }
            }
        };

        const parsed = parseGroup(['branch-text-ref'], branchRow, BRANCH_REF);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].inputRef).toBe('branch-text-ref');
        expect(parsed[0].answer).toBe('a branch text answer');
    });

    it('should return an empty answer for a missing member of a branch group', () => {
        const branchRow = {
            ...getEntry(),
            branch_entry: {
                ...getBranchEntry(),
                answers: {}
            }
        };

        const parsed = parseGroup(['branch-text-ref'], branchRow, BRANCH_REF);

        expect(parsed).toHaveLength(1);
        expect(parsed[0].answer).toBe('');
    });
});
