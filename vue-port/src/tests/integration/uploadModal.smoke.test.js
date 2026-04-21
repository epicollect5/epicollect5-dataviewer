import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import UploadModal from '@/components/upload/ModalUpload.vue';
import { useModalStore } from '@/stores/modalStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useUploadStore } from '@/stores/uploadStore';

describe('UploadModal smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders the prepared upload state', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const projectStore = useProjectStore();
    const uploadStore = useUploadStore();

    projectStore.projectSlug = 'demo';
    projectStore.projectMapping = [{ name: 'Default mapping', forms: {} }];
    uploadStore.uploadedRows = [{ title: 'Entry A' }];
    uploadStore.bulkUploadableHeaders = ['title'];
    uploadStore.reverseEntries = [{ entry: { title: 'Entry A' } }];
    uploadStore.uploadResults = [{ status: 'ok' }];

    const wrapper = mount(UploadModal, {
      global: {
        plugins: [pinia]
      }
    });

    expect(wrapper.text()).toContain('Uploaded 1 / 1');
  });

  it('resets the modal state and reloads the table when closing after uploaded rows', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const modalStore = useModalStore();
    const tableStore = useTableStore();
    const uploadStore = useUploadStore();

    modalStore.open('upload');
    tableStore.loadEntries = vi.fn().mockResolvedValue();
    uploadStore.uploadedRows = [{ title: 'Entry A' }];
    uploadStore.reverseEntries = [{ entry: { title: 'Entry A' } }];
    uploadStore.uploadResults = [{ status: 'ok' }];

    const wrapper = mount(UploadModal, {
      global: {
        plugins: [pinia]
      }
    });

    const closeButton = wrapper.findAll('button').find((button) => button.text() === 'Close');
    await closeButton.trigger('click');

    expect(modalStore.activeModal).toBe(null);
    expect(uploadStore.uploadedRows).toEqual([]);
    expect(uploadStore.reverseEntries).toEqual([]);
    expect(uploadStore.uploadResults).toEqual([]);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });
});
