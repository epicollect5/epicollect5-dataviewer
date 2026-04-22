import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PageTable from '@/pages/PageTable.vue';
import { useFiltersStore } from '@/stores/filtersStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useUploadStore } from '@/stores/uploadStore';

describe('TableView smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the table slice, debounces title filters, and opens a clean upload modal', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/:projectSlug/data',
          component: PageTable
        }
      ]
    });

    router.push('/demo/data');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
    const tableStore = useTableStore();
    const modalStore = useModalStore();
    const uploadStore = useUploadStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');

    tableStore.pagination = {
      total: 1,
      current_page: 1,
      last_page: 1
    };
    tableStore.links = {
      prev: null,
      next: null
    };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    uploadStore.uploadedRows = [{ title: 'stale row' }];
    uploadStore.uploadResults = [{ status: 'ok' }];

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.activePage).toBe('table');
    expect(tableStore.loadEntries).toHaveBeenCalledTimes(1);

    await wrapper.getComponent({ name: 'IonSearchbar' }).vm.$emit('ionInput', {
      detail: {
        value: 'river'
      }
    });
    await flushPromises();

    expect(filtersStore.filterByTitle).toBe('river');
    expect(tableStore.loadEntries).toHaveBeenCalledTimes(2);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 1 } });

    const uploadButton = wrapper.findAll('button').find((button) => button.text() === 'Upload');
    await uploadButton.trigger('click');

    expect(modalStore.activeModal).toBe('upload');
    expect(uploadStore.uploadedRows).toEqual([]);
    expect(uploadStore.uploadResults).toEqual([]);
  });
});
