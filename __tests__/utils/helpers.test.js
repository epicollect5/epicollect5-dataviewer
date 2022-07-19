import helpers from 'utils/helpers';
import PARAMETERS from 'config/parameters';


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
});
