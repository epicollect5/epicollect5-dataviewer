import PARAMETERS from '@/core/config/parameters';
import { buildFailedRows, prepareUploadFile } from '@/services/upload/uploadWorkflow';
import { uploadEntryWithResult } from '@/services/api/uploadApi';
import client from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

const buildFile = (content) => ({
  name: 'entries.csv',
  size: content.length,
  text: () => Promise.resolve(content)
});

const buildUploadContext = () => {
  const activeMapping = {
    map_index: 0,
    forms: { form_1: {} }
  };

  return {
    activeMapping,
    projectSlug: 'demo-project',
    projectExtra: {
      forms: {
        form_1: {
          branch: {},
          group: {}
        }
      },
      inputs: {}
    },
    projectDefinition: {
      project: {
        forms: [{ ref: 'form_1', inputs: [] }]
      }
    },
    projectMapping: [activeMapping],
    projectStats: { structure_last_updated: '1' },
    currentFormRef: 'form_1',
    navigationStore: { hierarchyNavigator: [{ formRef: 'form_1' }] }
  };
};

describe('services/upload/uploadWorkflow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a file with duplicate headers', async () => {
    const result = await prepareUploadFile({
      ...buildUploadContext(),
      file: buildFile('ec5_uuid,title,title\nuuid-1,First,Second\n')
    });

    expect(result).toEqual({
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_DUPLICATE_HEADERS_ERROR,
      data: null
    });
    expect(client.get).not.toHaveBeenCalled();
  });

  it('rejects a file with duplicate uuids', async () => {
    client.get.mockResolvedValue({ data: { data: { headers: ['ec5_uuid', 'title'] } } });

    const result = await prepareUploadFile({
      ...buildUploadContext(),
      file: buildFile('ec5_uuid,title\nuuid-1,First\nuuid-1,Second\n')
    });

    expect(result).toEqual({
      success: false,
      parsingError: PARAMETERS.LABELS.FILE_UUID_ERROR,
      data: null
    });
  });

  it('applies the jump flow to the prepared entries', async () => {
    const context = buildUploadContext();
    const radioInput = {
      ref: 'radio_input',
      type: PARAMETERS.INPUT_TYPES.EC5_RADIO_TYPE,
      is_title: false,
      datetime_format: null,
      jumps: [{ to: 'END', when: 'IS', answer_ref: 'r1' }]
    };
    const textInput = {
      ref: 'text_input',
      type: PARAMETERS.INPUT_TYPES.EC5_TEXT_TYPE,
      is_title: false,
      datetime_format: null,
      jumps: []
    };

    context.projectExtra.inputs = {
      radio_input: { data: radioInput },
      text_input: { data: textInput }
    };
    context.projectDefinition.project.forms[0].inputs = [radioInput, textInput];
    context.activeMapping.forms.form_1 = {
      radio_input: { map_to: 'Choice', possible_answers: { r1: { map_to: 'Skip' } } },
      text_input: { map_to: 'Text', possible_answers: {} }
    };
    client.get.mockResolvedValue({
      data: { data: { headers: ['Choice', 'Text'] } }
    });

    const result = await prepareUploadFile({
      ...context,
      file: buildFile('ec5_uuid,Choice,Text\nuuid-1,Skip,should be cleared\n')
    });

    expect(result.success).toBe(true);
    expect(result.data.reverseEntries[0].data.entry.answers.text_input).toEqual({
      was_jumped: true,
      answer: ''
    });
  });

  it('keeps the parent nulls when the helper finds no parent form', async () => {
    const context = buildUploadContext();

    context.navigationStore.hierarchyNavigator = [{ formRef: 'form_1' }, { formRef: 'form_2' }];
    client.get.mockResolvedValue({
      data: { data: { headers: ['ec5_uuid', 'title'] } }
    });

    const result = await prepareUploadFile({
      ...context,
      file: buildFile('ec5_uuid,title\nuuid-1,First\n')
    });

    expect(result.success).toBe(true);
    expect(result.data.reverseEntries[0].data.relationships.parent).toEqual({});
  });

  it('settles with an error result when the upload request fails without a response', async () => {
    client.post.mockRejectedValue(new Error('Network Error'));

    const result = await uploadEntryWithResult('demo-project', { data: {} });

    expect(result.status).toBe('error');
    expect(result.errors).toEqual([{ title: 'Network Error' }]);
  });

  it('keeps the server payload when the upload request fails with a response', async () => {
    client.post.mockRejectedValue({
      response: {
        data: {
          errors: [{ title: 'Validation failed' }]
        }
      }
    });

    const result = await uploadEntryWithResult('demo-project', { data: {} });

    expect(result.status).toBe('error');
    expect(result.errors).toEqual([{ title: 'Validation failed' }]);
  });

  it('keeps only the failed rows and strips the non uploadable headers', () => {
    const rows = buildFailedRows({
      uploadResults: [
        { status: 'ok' },
        { status: 'error' }
      ],
      uploadedRows: [
        { title: 'Entry A', internal_id: 12 },
        { title: 'Entry B', internal_id: 13 }
      ],
      bulkUploadableHeaders: ['title']
    });

    expect(rows).toEqual([
      { title: 'Entry B' }
    ]);
  });

  it('returns an empty list when no row failed', () => {
    const rows = buildFailedRows({
      uploadResults: [
        { status: 'ok' }
      ],
      uploadedRows: [
        { title: 'Entry A' }
      ],
      bulkUploadableHeaders: ['title']
    });

    expect(rows).toEqual([]);
  });
});
