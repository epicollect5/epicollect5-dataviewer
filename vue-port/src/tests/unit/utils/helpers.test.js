import PARAMETERS from '@/core/config/parameters';
import helpers from '@/utils/helpers';

describe('domain/shared/helpers', () => {
  it('returns the default mapping', () => {
    const mappings = JSON.parse(
      '[{"name":"EC5_AUTO","forms":{"a":{}},"map_index":0,"is_default":false},{"name":"mirko","forms":{"a":{}},"map_index":2,"is_default":true}]'
    );

    expect(helpers.getDefaultMapping(mappings)).toEqual(
      expect.objectContaining({
        name: 'mirko',
        is_default: true
      })
    );
  });

  it('returns the next form and form names', () => {
    const forms = JSON.parse(
      '[{"ref":"f1","name":"Class"},{"ref":"f2","name":"Pupil"},{"ref":"f3","name":"Test"}]'
    );

    expect(helpers.getNextForm(forms, 'f1')).toEqual(expect.objectContaining({ ref: 'f2', name: 'Pupil' }));
    expect(helpers.getNextForm(forms, 'f3')).toBe(false);
    expect(helpers.getPrevForm(forms, 'f2')).toEqual(expect.objectContaining({ ref: 'f1', name: 'Class' }));
    expect(helpers.getFormName(forms, 'f3')).toBe('Test');
  });

  it('returns the query string of an url', () => {
    expect(helpers.getQueryString('https://five.epicollect.net/data?first=1&second=2')).toBe('first=1&second=2');
    expect(helpers.getQueryString('https://five.epicollect.net/data?first=1')).toBe('first=1');
    expect(helpers.getQueryString('https://five.epicollect.net/data')).toBe('');
  });

  it('returns false for navigation outside the list bounds', () => {
    const forms = [{ ref: 'f1' }, { ref: 'f2' }, { ref: 'f3' }];
    const uploadForms = [
      { formRef: 'f1' },
      { formRef: 'f2', parentEntryUuid: 'parent-1' }
    ];

    expect(helpers.getNextForm(forms, 'f3')).toBe(false);
    expect(helpers.getPrevForm(forms, 'f1')).toBe(false);
    expect(helpers.getParentFormForUpload(uploadForms, 'f1')).toBe(false);
    expect(helpers.getParentFormForUpload(uploadForms, 'f2')).toEqual({
      parentFormRef: 'f1',
      parentEntryUuid: 'parent-1'
    });
    expect(helpers.getParentFormForUpload(uploadForms, 'missing')).toBe(false);
  });

  it('truncates text using legacy defaults', () => {
    expect(helpers.textTruncate('Mirko is at home', 10, null)).toBe('Mirko i...');
    expect(helpers.textTruncate('Mirko', 10, null)).toBe('Mirko');
    expect(helpers.textTruncate('The lazy dog is jumping around', null, null)).toBe('The lazy dog is j...');
  });

  it('reads url parameters and xsrf cookies', () => {
    expect(helpers.getParameterByName('second', 'https://five.epicollect.net/data?first=1&second=2')).toBe('2');
    expect(helpers.getParameterByName('missing', 'https://five.epicollect.net/data?first=1')).toBe(null);
    expect(helpers.getXsrfToken('one=1; XSRF-TOKEN=abc%20123; two=2')).toBe('abc 123');
  });

  it('builds upload and download endpoints with current filters', () => {
    const uploadTemplate = helpers.getUploadTemplateEndpoint({
      mapIndex: 2,
      formIndex: 0,
      currentBranchRef: null,
      format: PARAMETERS.FORMAT_CSV,
      requestTimestamp: 1700000000,
      filename: 'entries.csv',
      projectSlug: 'demo-project'
    });

    expect(uploadTemplate).toContain('/api/internal/upload-template/demo-project?');
    expect(uploadTemplate).toContain('map_index=2');
    expect(uploadTemplate).toContain('filename=entries.csv');

    const downloadEntries = helpers.getDownloadEntriesEndpoint({
      mapIndex: 2,
      format: PARAMETERS.FORMAT_CSV,
      activeTimeframe: PARAMETERS.TIMEFRAME.CUSTOM,
      selectedStartDate: '2024-01-01',
      selectedEndDate: '2024-01-31',
      requestTimestamp: 1700000000,
      projectSlug: 'demo-project'
    });

    expect(downloadEntries).toContain('/api/internal/download-entries/demo-project?');
    expect(downloadEntries).toContain('map_index=2');
    expect(downloadEntries).toContain('format=csv');
    expect(downloadEntries).toContain('filter_by=created_at');
    expect(downloadEntries).toContain('filter_from=2024-01-01');
    expect(downloadEntries).toContain('filter_to=2024-01-31');
    expect(downloadEntries).toContain('epicollect5-download-entries=1700000000');

    const downloadSubset = helpers.getDownloadSubsetEndpoint({
      hierarchyNavigator: [{ selfLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=f1&page=2' }],
      filterSortOrder: 'DESC',
      filterByTitle: 'abc',
      filterStartDate: '2024-01-01',
      filterEndDate: '2024-01-31',
      requestTimestamp: 1700000000,
      filename: 'subset.csv',
      currentBranchRef: null,
      currentBranchOwnerUuid: null,
      projectSlug: 'demo-project'
    });

    expect(downloadSubset).toContain('/api/internal/download-entries-subset/demo-project?');
    expect(downloadSubset).toContain('page=2');
    expect(downloadSubset).toContain('title=abc');
    expect(downloadSubset).toContain('filename=subset.csv');
  });

  it('matches jump conditions for scalar and array answers', () => {
    expect(
      helpers.doesAnswerMatchAJump(
        { type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE },
        { answer_ref: 'yes' },
        'yes',
        'IS'
      )
    ).toBe(true);

    expect(
      helpers.doesAnswerMatchAJump(
        { type: PARAMETERS.INPUT_TYPES.EC5_CHECKBOX_TYPE },
        { answer_ref: 'b' },
        ['a', 'b'],
        'IS'
      )
    ).toBe(true);

    expect(
      helpers.doesAnswerMatchAJump(
        { type: PARAMETERS.INPUT_TYPES.EC5_SEARCH_MULTIPLE_TYPE },
        { answer_ref: 'c' },
        ['a', 'b'],
        'IS_NOT'
      )
    ).toBe(true);
  });
});
