import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import DrawerUpload from '@/components/upload/DrawerUpload.vue';
import { startDownload } from '@/services/download/downloadWorkflow';
import { useFiltersStore } from '@/stores/filtersStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useUploadStore } from '@/stores/uploadStore';

vi.mock('@/services/download/downloadWorkflow', () => ({
  startDownload: vi.fn(() => vi.fn())
}));

const setupStores = () => {
  const projectStore = useProjectStore();
  const navigationStore = useNavigationStore();
  const tableStore = useTableStore();
  const filtersStore = useFiltersStore();
  const uploadStore = useUploadStore();

  projectStore.projectSlug = 'demo-project';
  projectStore.projectDefinition = {
    project: {
      slug: 'demo-project',
      forms: [{ ref: 'form_1', name: 'Form 1' }]
    }
  };
  projectStore.projectMapping = [
    { name: 'Default mapping', map_index: 0 },
    { name: 'Second mapping', map_index: 2 }
  ];

  navigationStore.setCurrentForm('form_1', 'Form 1');
  tableStore.links = {
    self: 'https://five.epicollect.net/api/internal/entries/demo-project?form_ref=form_1&page=1'
  };
  filtersStore.setTitle('abc');
  filtersStore.setDates('2024-01-01', '2024-01-31');
  filtersStore.setOrder('A - Z', 'title', 'ASC');
  uploadStore.setActiveMapping(0);

  return {
    projectStore,
    uploadStore
  };
};

describe('components/upload/DrawerUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('renders the legacy upload controls', () => {
    setupStores();

    const wrapper = mount(DrawerUpload);
    const text = wrapper.text();

    expect(text).toContain('Mapping');
    expect(text).toContain('File');
    expect(text).toContain('Current View Template');
    expect(text).toContain('Current View Subset');
    expect(text).toContain('Choose');
    expect(wrapper.findAll('button').filter((button) => button.text() === 'Download')).toHaveLength(2);
  });

  it('changes the active mapping', () => {
    const { uploadStore } = setupStores();
    const wrapper = mount(DrawerUpload);

    wrapper.vm.handleMappingChange(1);

    expect(uploadStore.activeMappingIndex).toBe(1);
  });

  it('downloads the current view template', () => {
    setupStores();
    const modalStore = useModalStore();
    const wrapper = mount(DrawerUpload);

    wrapper.findAll('button').filter((button) => button.text() === 'Download')[0].trigger('click');

    expect(modalStore.activeModal).toBe('prepare-download');
    expect(startDownload).toHaveBeenCalledTimes(1);

    const { endpoint } = startDownload.mock.calls[0][0];
    expect(endpoint).toContain('/api/internal/upload-template/demo-project?');
    expect(decodeURIComponent(endpoint).replace(/\+/g, ' ')).toContain('filename=demo-project__Form 1__Default mapping__upload-template');
  });

  it('downloads the current view subset with the table filters', () => {
    setupStores();
    const wrapper = mount(DrawerUpload);

    wrapper.findAll('button').filter((button) => button.text() === 'Download')[1].trigger('click');

    const { endpoint } = startDownload.mock.calls[0][0];
    const decodedEndpoint = decodeURIComponent(endpoint).replace(/\+/g, ' ');

    expect(endpoint).toContain('/api/internal/download-entries-subset/demo-project?');
    expect(decodedEndpoint).toContain('form_ref=form_1');
    expect(decodedEndpoint).toContain('title=abc');
    expect(decodedEndpoint).toContain('filter_from=2024-01-01');
    expect(decodedEndpoint).toContain('filter_to=2024-01-31');
    expect(decodedEndpoint).toContain('filename=demo-project__Form 1__Default mapping__subset.zip');
  });

  it('prepares the chosen csv and opens the upload modal', async () => {
    const { uploadStore } = setupStores();
    const modalStore = useModalStore();
    const wrapper = mount(DrawerUpload);
    const file = new File(['ec5_uuid,title\nuuid-1,First\n'], 'entries.csv', { type: 'text/csv' });

    uploadStore.prepareFile = vi.fn().mockResolvedValue(true);
    uploadStore.uploadPreparedEntries = vi.fn().mockResolvedValue();

    const fileInput = wrapper.find('input[type="file"]');
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      configurable: true
    });

    await fileInput.trigger('change');
    await flushPromises();

    expect(uploadStore.prepareFile).toHaveBeenCalledWith(file);
    expect(modalStore.activeModal).toBe('upload');
    expect(uploadStore.uploadPreparedEntries).toHaveBeenCalledTimes(1);
  });
});
