import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PageTable from '@/pages/PageTable.vue';
import routes from '@/router/routes';
import { useDrawerStore } from '@/stores/drawerStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

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
          path: '/project/:projectSlug?/data',
          component: PageTable
        }
      ]
    });

    router.push('/project/demo/data');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
    const tableStore = useTableStore();
    const drawerStore = useDrawerStore();

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

    expect(drawerStore.activeDrawer).toBe('upload');
    expect(drawerStore.payload.side).toBe('left');
  });

  it('shows a back link to the parent form while viewing children', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/project/:projectSlug?/data',
          component: PageTable
        }
      ]
    });

    router.push('/project/demo/data');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [
          { ref: 'form_1', name: 'Form 1' },
          { ref: 'form_2', name: 'Form 2' }
        ]
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });

    tableStore.rowCount = 0;
    tableStore.pagination = {
      total: 0,
      current_page: 1,
      last_page: 1
    };
    tableStore.links = {
      prev: null,
      next: null
    };
    tableStore.loadEntries = vi.fn().mockResolvedValue();
    const navigateBack = vi.spyOn(tableStore, 'navigateBack').mockResolvedValue();

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Form 1');

    await wrapper.get('[aria-label="Back to parent form"]').trigger('click');

    expect(navigateBack).toHaveBeenCalledTimes(1);
  });

  it('loads the project from the slug in the url', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    });

    await router.push('/project/another-project/data');
    await router.isReady();

    const projectStore = useProjectStore();
    const loadProject = vi.spyOn(projectStore, 'loadProject').mockResolvedValue(true);

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(router.currentRoute.value.params.projectSlug).toBe('another-project');
    expect(loadProject).toHaveBeenCalledWith('another-project');
  });
});
