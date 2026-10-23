import table from 'utils/table';
import PARAMETERS from 'config/parameters';
import { getProjectExtra, FORM_REF, BRANCH_REF } from '../fixtures/projectExtra';
import { getEntry, getBranchEntry, getEntriesPayload } from '../fixtures/entries';

const projectExtra = getProjectExtra();
const projectSlug = 'a-project';

const entry = getEntry();

describe('table utils test', () => {

    describe('getFixedHeaders', () => {

        it('should return the 6 fixed headers', () => {
            const headers = table.getFixedHeaders(2, 'Entry title 1', '2018-02-24T17:59:29.179Z', 'entry-uuid-1', [], false);

            expect(headers).toHaveLength(6);
            expect(headers[0].cellType).toBe('CellView');
            expect(headers[1].cellType).toBe('CellDelete');
            expect(headers[2].cellType).toBe('CellEdit');
            expect(headers[3].cellType).toBe('CellChildren');
            expect(headers[3].answer).toBe(2);
            expect(headers[4].cellType).toBe('CellText');
            expect(headers[4].answer).toBe('Entry title 1');
            expect(headers[5].cellType).toBe('CellText');
        });

        it('should format the created at date', () => {
            const headers = table.getFixedHeaders(2, 'Entry title 1', '2018-02-24T17:59:29.179Z', 'entry-uuid-1', [], false);

            //the date is timezone sensitive, so match the shape instead of the value
            expect(headers[5].answer).toEqual(expect.stringMatching(/^\d{1,2}(st|nd|rd|th) [A-Z][a-z]{2}, \d{4}$/));
        });

        it('should remove the children column when it is a branch', () => {
            const headers = table.getFixedHeaders(2, 'Entry title 1', '2018-02-24T17:59:29.179Z', 'entry-uuid-1', [], true);

            expect(headers).toHaveLength(5);
            expect(headers.map((header) => header.cellType)).not.toContain('CellChildren');
        });

        it('should keep the entry uuid on every header', () => {
            const headers = table.getFixedHeaders(2, 'Entry title 1', '2018-02-24T17:59:29.179Z', 'entry-uuid-1', [], false);

            headers.forEach((header) => {
                expect(header.entryUuid).toBe('entry-uuid-1');
            });
        });
    });

    describe('getHeaders', () => {

        it('should flatten the group inputs into top level columns', () => {
            const headers = table.getHeaders(projectExtra, FORM_REF);

            const groupHeaders = headers.filter((header) => header.groupInputRef);
            expect(groupHeaders.map((header) => header.groupInputRef)).toEqual(['group-text-ref', 'group2-text-ref']);
        });

        it('should skip the readme inputs', () => {
            const headers = table.getHeaders(projectExtra, FORM_REF);

            expect(headers).toHaveLength(18);
            headers.forEach((header) => {
                expect(header.question).not.toBe('Readme question');
                expect(header.question).not.toBe('Group readme question');
                expect(header.question).not.toBe('Second group readme question');
            });
        });

        it('should keep the input ref on the plain columns', () => {
            const headers = table.getHeaders(projectExtra, FORM_REF);

            const textHeader = headers.find((header) => header.inputRef === 'text-ref');
            expect(textHeader.question).toBe('Text question');
            expect(textHeader.groupInputRef).toBeUndefined();
        });
    });

    describe('getBranchHeaders', () => {

        it('should return the headers of the branch inputs', () => {
            const headers = table.getBranchHeaders(projectExtra, FORM_REF, BRANCH_REF);

            expect(headers).toHaveLength(2);
            expect(headers[0].inputRef).toBe('branch-text-ref');
            expect(headers[1].inputRef).toBe('branch-radio-ref');
        });
    });

    describe('getRows', () => {

        it('should prepend the fixed cells to the parsed answers', () => {
            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entry]));

            expect(rows).toHaveLength(1);
            //6 fixed cells + 18 data cells
            expect(rows[0]).toHaveLength(24);
            expect(rows[0][0].cellType).toBe('CellView');
            expect(rows[0][3].cellType).toBe('CellChildren');
            expect(rows[0][4].answer).toBe('Entry title 1');
        });

        it('should parse an answered input', () => {
            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entry]));

            expect(rows[0][6].inputRef).toBe('text-ref');
            expect(rows[0][6].answer).toBe('a text answer');
        });

        it('should flatten a group input into its members', () => {
            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entry]));

            const groupCell = rows[0].find((cell) => cell.inputRef === 'group-text-ref');
            expect(groupCell.answer).toBe('a group text answer');
        });

        it('should return an empty answer for an unanswered non readme input', () => {
            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entry]));

            //the empty entry carries no input ref, only the input type and the cell type
            const emptyCell = rows[0].find((cell) => cell.inputRef === undefined && cell.answer === '');
            expect(emptyCell.answer).toBe('');
            expect(emptyCell.inputType).toBe(PARAMETERS.INPUT_TYPES.TEXT);
        });

        it('should skip an unanswered readme input', () => {
            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entry]));

            const readmeCells = rows[0].filter((cell) => cell.inputRef === 'readme-ref');
            expect(readmeCells).toHaveLength(0);
        });

        it('should use 0 as the children count when it is null', () => {
            const entryWithoutChildren = getEntry({
                attributes: {
                    child_counts: null,
                    branch_counts: { 'branch-ref': 3 }
                }
            });

            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([entryWithoutChildren]));

            expect(rows[0][3].answer).toBe(0);
        });

        it('should build the branch rows without the children column', () => {
            const branchRow = {
                ...getEntry(),
                branch_entry: getBranchEntry()
            };

            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([branchRow]), BRANCH_REF);

            //5 fixed cells (no children column) + 2 branch data cells
            expect(rows[0]).toHaveLength(7);
            expect(rows[0].map((cell) => cell.cellType)).not.toContain('CellChildren');
        });

        it('should parse the branch answers', () => {
            const branchRow = {
                ...getEntry(),
                branch_entry: getBranchEntry()
            };

            const rows = table.getRows(projectSlug, projectExtra, FORM_REF, getEntriesPayload([branchRow]), BRANCH_REF);

            expect(rows[0][5].inputRef).toBe('branch-text-ref');
            expect(rows[0][5].answer).toBe('a branch text answer');
            expect(rows[0][6].answer).toBe('Branch Radio A');
        });
    });

    describe('getChildFormRef', () => {

        const forms = [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }];

        it('should return the next form ref', () => {
            expect(table.getChildFormRef(forms, 'a')).toBe('b');
            expect(table.getChildFormRef(forms, 'b')).toBe('c');
        });

        it('should return false when the form ref is not in the list', () => {
            expect(table.getChildFormRef(forms, 'not-a-form')).toBe(false);
        });

        it('should return false when the form is the last one', () => {
            expect(table.getChildFormRef(forms, 'c')).toBe(false);
        });
    });

    describe('getParentFormRef', () => {

        const forms = [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }];

        it('should return the previous form ref', () => {
            expect(table.getParentFormRef(forms, 'b')).toBe('a');
            expect(table.getParentFormRef(forms, 'c')).toBe('b');
        });

        it('should return false when the form ref is not in the list', () => {
            expect(table.getParentFormRef(forms, 'not-a-form')).toBe(false);
        });

        it('should return false when the form is the first one', () => {
            expect(table.getParentFormRef(forms, 'a')).toBe(false);
        });
    });
});
