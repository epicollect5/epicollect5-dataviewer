import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import UploadModal from '@/components/upload/ModalUpload.vue';
import { useProjectStore } from '@/stores/projectStore';
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
});
