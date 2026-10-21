import moment from 'moment';
import helpers from 'utils/helpers';
import PARAMETERS from 'config/parameters';
import { mockCurrentDate, restoreRealDate } from '../fixtures/mockDate';


describe('helpers utils test', () => {

    it('should return active mapping', () => {

        const mappings = '[{"name":"EC5_AUTO","forms":{"b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3":{}},"map_index":0,"is_default":false},{"name":"ants map","forms":{"b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3":{}},"map_index":1,"is_default":false},{"name":"mirko","forms":{"b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3":{}},"map_index":2,"is_default":true},{"name":"Bestpint5","forms":{"b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3":{}},"map_index":3,"is_default":false}]';

        const JSONMappings = JSON.parse(mappings);

        expect(helpers.getDefaultMapping(JSONMappings)).toEqual({
            name: 'mirko',
            forms: {
                b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3: {}
            },
            map_index: 2,
            is_default: true
        });

        expect(helpers.getDefaultMapping(JSONMappings))
            .toEqual(expect.objectContaining({
                name: 'mirko',
                is_default: true
            }));

        expect(helpers.getDefaultMapping(JSONMappings))
            .not.toEqual(expect.objectContaining({
            is_default: false
        }));

        expect(helpers.getDefaultMapping(JSONMappings)).not.toEqual({
            name: 'EC5_AUTO',
            forms: {
                b8a4ac0a586b46dd8ad41ecf9eff39a7_577bc67fe09a3: {}
            },
            map_index: 0,
            is_default: false
        });
    });

    it('should return the next form', () => {

        const forms = JSON.parse('[{"ref":"584ccf290bd547e38b4ccf7e27d03c77_5784e68dcf6f5","name":"Class","slug":"class","type":"hierarchy","inputs":[]},{"ref":"584ccf290bd547e38b4ccf7e27d03c77_5784e69e88f5e","name":"Pupil","slug":"pupil","type":"hierarchy","inputs":[]},{"ref":"584ccf290bd547e38b4ccf7e27d03c77_584f0da7b0fea","name":"Test","slug":"test","type":"hierarchy","inputs":[]}]');

        let formRef = '584ccf290bd547e38b4ccf7e27d03c77_5784e68dcf6f5';
        expect(helpers.getNextForm(forms, formRef))
            .toEqual(expect.objectContaining({
                ref: '584ccf290bd547e38b4ccf7e27d03c77_5784e69e88f5e',
                name: 'Pupil'
            }));

        formRef = '584ccf290bd547e38b4ccf7e27d03c77_5784e69e88f5e';
        expect(helpers.getNextForm(forms, formRef))
            .toEqual(expect.objectContaining({
                ref: '584ccf290bd547e38b4ccf7e27d03c77_584f0da7b0fea',
                name: 'Test'
            }));

        //no next form, return false
        formRef = '584ccf290bd547e38b4ccf7e27d03c77_584f0da7b0fea';
        expect(helpers.getNextForm(forms, formRef))
            .toBe(false);
    });

    it('should truncate the string', () => {

        let str = 'Mirko is at home';
        let len = 10;

        expect(helpers.textTruncate(str, len, null)).toEqual('Mirko i...');

        str = 'Mirko';
        len = 10;

        expect(helpers.textTruncate(str, len, null)).toEqual('Mirko');

        str = 'The lazy dog is jumping around';
        len = null;

        expect(helpers.textTruncate(str, len, null)).toEqual('The lazy dog is j...');

    });

    it('should return the form name', () => {

        const forms = JSON.parse('[{"ref":"584ccf290bd547e38b4ccf7e27d03c77_5784e68dcf6f5","name":"Class","slug":"class","type":"hierarchy","inputs":[]},{"ref":"584ccf290bd547e38b4ccf7e27d03c77_5784e69e88f5e","name":"Pupil","slug":"pupil","type":"hierarchy","inputs":[]},{"ref":"584ccf290bd547e38b4ccf7e27d03c77_584f0da7b0fea","name":"Test","slug":"test","type":"hierarchy","inputs":[]}]');

        let formRef = '584ccf290bd547e38b4ccf7e27d03c77_5784e68dcf6f5';

        expect(helpers.getFormName(forms, formRef))
            .toEqual('Class');

        formRef = '584ccf290bd547e38b4ccf7e27d03c77_5784e69e88f5e';

        expect(helpers.getFormName(forms, formRef))
            .toEqual('Pupil');

        formRef = '584ccf290bd547e38b4ccf7e27d03c77_584f0da7b0fea';

        expect(helpers.getFormName(forms, formRef))
            .toEqual('Test');
    });

    it('should return the parameter by name from url', () => {

        let url = 'https://five.epicollect.net/data?test=1';
        let name = 'test';

        expect(helpers.getParameterByName(name, url))
            .toEqual('1');

        url = 'https://five.epicollect.net/data?convoy=done';
        name = 'convoy';

        expect(helpers.getParameterByName(name, url))
            .toEqual('done');

        url = 'https://five.epicollect.net/data?first=1&second=2';
        name = 'second';

        expect(helpers.getParameterByName(name, url))
            .toEqual('2');

    });

    it('should tell if a number is odd', () => {

        expect(helpers.isOdd(3)).toBe(true);
        expect(helpers.isOdd(4)).toBe(false);
    });

    it('should return the previous form', () => {

        const forms = [{ ref: 'a', name: 'A' }, { ref: 'b', name: 'B' }, { ref: 'c', name: 'C' }];

        expect(helpers.getPrevForm(forms, 'b')).toEqual(forms[0]);
        expect(helpers.getPrevForm(forms, 'c')).toEqual(forms[1]);
        //there is no previous form
        expect(helpers.getPrevForm(forms, 'a')).toBe(false);
    });

    it('should return the xsrf token', () => {

        document.cookie = 'XSRF-TOKEN=abc123';
        expect(helpers.getXsrfToken()).toBe('abc123');
        //clean up
        document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    });

    it('should remove an item from a list', () => {

        expect(helpers.removeItem(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
        expect(helpers.removeItem(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    });

    it('should return the upload template endpoint', () => {

        const endpoint = helpers.getUploadTemplateEndpoint({
            mapIndex: 0,
            formIndex: 1,
            currentBranchRef: null,
            format: 'csv',
            requestTimestamp: 'a-timestamp',
            filename: 'a-file.csv',
            projectSlug: 'a-project'
        });

        expect(endpoint).toContain(PARAMETERS.SERVER_URL + PARAMETERS.API_UPLOAD_TEMPLATE_ENDPOINT + 'a-project');
        expect(endpoint).toContain('map_index=0');
        expect(endpoint).toContain('form_index=1');
        expect(endpoint).toContain('format=csv');
    });

    it('should return the upload headers endpoint', () => {

        const endpoint = helpers.getUploadHeadersEndpoint({
            mapIndex: 0,
            formIndex: 1,
            currentBranchRef: 'branch-1',
            format: 'csv',
            projectSlug: 'a-project'
        });

        expect(endpoint).toContain(PARAMETERS.SERVER_URL + PARAMETERS.API_UPLOAD_HEADERS_ENDPOINT + 'a-project');
        expect(endpoint).toContain('branch_ref=branch-1');
        expect(endpoint).toContain('format=csv');
    });

    it('should return the download subset endpoint', () => {

        const endpoint = helpers.getDownloadSubsetEndpoint({
            hierarchyNavigator: [{
                selfLink: 'https://five.epicollect.net/api/internal/entries/a-project?form_ref=form-1'
            }],
            filterSortOrder: 'DESC',
            filterByTitle: 'a-title',
            filterStartDate: '2018-01-01',
            filterEndDate: '2018-02-01',
            requestTimestamp: 'a-timestamp',
            filename: 'a-file.csv',
            currentBranchRef: null,
            currentBranchOwnerUuid: null,
            projectSlug: 'a-project'
        });

        expect(endpoint).toContain(PARAMETERS.SERVER_URL + PARAMETERS.API_DOWNLOAD_SUBSET_ENDPOINT + 'a-project');
        expect(endpoint).toContain('format=csv');
        expect(endpoint).toContain('filter_by=created_at');
        expect(endpoint).toContain('sort_order=DESC');
        expect(endpoint).toContain('title=a-title');
    });

    it('should return the form index from a form ref', () => {

        const forms = [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }];

        expect(helpers.getFormIndexFromRef(forms, 'b')).toBe(1);
        expect(helpers.getFormIndexFromRef(forms, 'c')).toBe(2);
        //not found
        expect(helpers.getFormIndexFromRef(forms, 'not-a-form')).toBe(0);
    });

    it('should return the branch input index from a ref', () => {

        const inputs = [{ ref: 'a' }, { ref: 'b' }];

        expect(helpers.getBranchInputIndexFromRef(inputs, 'b')).toBe(1);
        //not found
        expect(helpers.getBranchInputIndexFromRef(inputs, 'not-an-input')).toBe(0);
    });

    it('should generate a uuid', () => {

        const uuid = helpers.generateUuid();

        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(helpers.generateUuid()).not.toBe(uuid);
    });

    it('should return the parent form for an upload', () => {

        const forms = [
            { formRef: 'form-1', parentEntryUuid: null },
            { formRef: 'form-2', parentEntryUuid: 'parent-uuid' }
        ];

        expect(helpers.getParentFormForUpload(forms, 'form-2')).toEqual({
            parentFormRef: 'form-1',
            parentEntryUuid: 'parent-uuid'
        });
        //not found
        expect(helpers.getParentFormForUpload(forms, 'not-a-form')).toBe(false);
    });

    it('should tell if an answer matches a jump', () => {

        const textInput = { type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE };
        const checkboxInput = { type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE };
        const jump = { answer_ref: 'ref-a' };

        expect(helpers.doesAnswerMatchAJump(textInput, jump, 'ref-a', 'IS')).toBe(true);
        expect(helpers.doesAnswerMatchAJump(textInput, jump, 'ref-b', 'IS')).toBe(false);
        expect(helpers.doesAnswerMatchAJump(textInput, jump, 'ref-b', 'IS_NOT')).toBe(true);
        expect(helpers.doesAnswerMatchAJump(textInput, jump, 'ref-a', 'IS_NOT')).toBe(false);

        expect(helpers.doesAnswerMatchAJump(checkboxInput, jump, ['ref-a'], 'IS')).toBe(true);
        expect(helpers.doesAnswerMatchAJump(checkboxInput, jump, ['ref-b'], 'IS')).toBe(false);
        expect(helpers.doesAnswerMatchAJump(checkboxInput, jump, ['ref-b'], 'IS_NOT')).toBe(true);
    });

    describe('getTimeframeParams', () => {

        //a fixed instant at noon UTC keeps the local date the same
        //in every timezone within 12 hours of UTC
        const fixedDate = '2026-10-20T12:00:00.000Z';

        afterEach(() => {
            restoreRealDate();
        });

        it('should not filter the lifetime', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.LIFETIME, {}))
                .toEqual({ filter_by: 'created_at' });
        });

        it('should filter from today', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.TODAY, {}))
                .toEqual({
                    filter_by: 'created_at',
                    filter_from: moment(fixedDate).format('YYYY-MM-DD')
                });
        });

        it('should filter from the last 7 days', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.LAST_7_DAYS, {}))
                .toEqual({
                    filter_by: 'created_at',
                    filter_from: moment(fixedDate).subtract(7, 'd').format('YYYY-MM-DD')
                });
        });

        it('should filter from the last 30 days', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.LAST_30_DAYS, {}))
                .toEqual({
                    filter_by: 'created_at',
                    filter_from: moment(fixedDate).subtract(30, 'd').format('YYYY-MM-DD')
                });
        });

        it('should filter from the beginning of the year', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.YEAR, {}))
                .toEqual({
                    filter_by: 'created_at',
                    filter_from: moment(fixedDate).year() + '-01-01'
                });
        });

        it('should filter with the custom dates', () => {
            mockCurrentDate(fixedDate);

            expect(helpers.getTimeframeParams(PARAMETERS.TIMEFRAME.CUSTOM, {
                selectedStartDate: '2026-01-01T00:00:00.000Z',
                selectedEndDate: '2026-02-01T00:00:00.000Z'
            })).toEqual({
                filter_by: 'created_at',
                filter_from: moment('2026-01-01T00:00:00.000Z').format('YYYY-MM-DD'),
                filter_to: moment('2026-02-01T00:00:00.000Z').format('YYYY-MM-DD')
            });
        });
    });

});
