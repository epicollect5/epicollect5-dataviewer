import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import PageTable from '@/pages/PageTable.vue';
import routes from '@/router/routes';
import { getCachedEntriesPage, setCachedEntriesPage } from '@/services/entries/entriesPageCache';
import { useDrawerStore } from '@/stores/drawerStore';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';

describe('TableView smoke', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
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

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Form 1');

    //the real store action runs, so the hierarchy itself has to come back
    await wrapper.get('[aria-label="Back to parent form"]').trigger('click');
    await flushPromises();

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.currentFormName).toBe('Form 1');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(navigationStore.hierarchyNavigator).toHaveLength(1);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 1 } });
    expect(tableStore.buildEntriesParams({})).not.toHaveProperty('parent_uuid');
    expect(wrapper.find('.table-view__hierarchy-nav').exists()).toBe(false);
  });

  it('restores the saved view left behind by the data editor', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
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

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_2',
      formName: 'Form 2',
      parentFormRef: 'form_2',
      hierarchyNavigator: [
        { formRef: 'form_1', formName: 'Form 1' },
        { formRef: 'form_2', formName: 'Form 2', parentEntryUuid: 'entry-1', parentEntryTitle: 'Parent entry' }
      ],
      isViewingChildren: true,
      isViewingBranch: false,
      page: 2,
      entriesFilters: {
        filterByTitle: 'river',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.currentFormRef).toBe('form_2');
    expect(navigationStore.isViewingChildren).toBe(true);
    expect(navigationStore.isRestoring).toBe(true);
    expect(filtersStore.filterByTitle).toBe('river');
    expect(tableStore.loadEntries).toHaveBeenCalledTimes(1);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 2 } });
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Form 1');
  });

  it('restores the root form view that opened the data editor', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
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

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: false,
      page: 3,
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Oldest',
        sortBy: 'created_at',
        sortOrder: 'ASC'
      }
    }));

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(filtersStore.selectedOrderBy).toBe('Oldest');
    expect(filtersStore.sortOrder).toBe('ASC');
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 3 } });
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
    expect(wrapper.find('[aria-label="Back to parent form"]').exists()).toBe(false);
  });

  it('boots the root form when the saved view is stale', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
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

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'another-project',
      savedAt: Date.now(),
      formRef: 'form_2',
      hierarchyNavigator: [
        { formRef: 'form_1', formName: 'Form 1' },
        { formRef: 'form_2', formName: 'Form 2' }
      ],
      isViewingChildren: true,
      page: 2
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(filtersStore.filterByTitle).toBe('');
    expect(tableStore.loadEntries).toHaveBeenCalledWith();
    //the blob is left for its own project, it is not this view's to delete
    expect(localStorage.getItem('epicollect5-restore')).not.toBe(null);
  });

  it('shows the branch back navigation while viewing a branch', async () => {
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
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    projectStore.projectExtra = {
      forms: {
        form_1: {
          inputs: ['branch_1'],
          group: {},
          branch: { branch_1: ['q1'] },
          lists: {}
        }
      },
      inputs: {
        branch_1: { data: { ref: 'branch_1', type: 'branch', question: 'Branch question' } },
        q1: { data: { ref: 'q1', type: 'text', question: 'Q1' } }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-1',
      ownerEntryTitle: 'Parent entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1&page=1'
    });

    tableStore.pagination = {
      total: 1,
      current_page: 1,
      last_page: 1
    };
    tableStore.links = { prev: null, next: null };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Parent entry | Branch question');
    expect(wrapper.find('[aria-label="Back to parent form"]').exists()).toBe(false);

    //the real store action runs, so the branch scope has to be dropped and the
    //owner form reloaded
    await wrapper.get('[aria-label="Back to entry"]').trigger('click');
    await flushPromises();

    expect(navigationStore.isViewingBranch).toBe(false);
    expect(navigationStore.currentBranchRef).toBe(null);
    expect(navigationStore.currentBranchOwnerUuid).toBe(null);
    expect(navigationStore.currentBranchOwnerEntryTitle).toBe(null);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 1 } });
    expect(tableStore.buildEntriesParams({})).not.toHaveProperty('branch_ref');
    expect(tableStore.buildEntriesParams({})).not.toHaveProperty('branch_owner_uuid');
    expect(wrapper.find('.table-view__hierarchy-nav').exists()).toBe(false);
  });

  it('keeps the child hierarchy when leaving a branch opened from a child view', async () => {
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
    projectStore.projectExtra = {
      forms: {
        form_2: {
          inputs: ['branch_1'],
          group: {},
          branch: { branch_1: ['q1'] },
          lists: {}
        }
      },
      inputs: {
        branch_1: { data: { ref: 'branch_1', type: 'branch', question: 'Branch question' } },
        q1: { data: { ref: 'q1', type: 'text', question: 'Q1' } }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });
    navigationStore.enterBranch({
      branchRef: 'branch_1',
      ownerEntryUuid: 'entry-2',
      ownerEntryTitle: 'Child entry',
      backLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_2&page=1'
    });

    tableStore.pagination = {
      total: 1,
      current_page: 1,
      last_page: 1
    };
    tableStore.links = { prev: null, next: null };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Child entry | Branch question');

    await wrapper.get('[aria-label="Back to entry"]').trigger('click');
    await flushPromises();

    expect(navigationStore.isViewingBranch).toBe(false);
    expect(navigationStore.isViewingChildren).toBe(true);
    expect(navigationStore.currentFormRef).toBe('form_2');
    expect(navigationStore.hierarchyNavigator).toHaveLength(2);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 1 } });
    expect(wrapper.get('.table-view__hierarchy-label').text()).toBe('Form 1');
  });

  it('restores a branch view left behind by the data editor', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Parent entry',
      branchBackLink: 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1&page=1',
      page: 2,
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.isViewingBranch).toBe(true);
    expect(navigationStore.currentBranchRef).toBe('branch_1');
    expect(navigationStore.currentBranchOwnerUuid).toBe('entry-1');
    expect(navigationStore.currentBranchOwnerEntryTitle).toBe('Parent entry');
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 2 } });
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);

    //the page the restore came from is the owner view the branch is left to
    await wrapper.get('[aria-label="Back to entry"]').trigger('click');
    await flushPromises();

    expect(navigationStore.isViewingBranch).toBe(false);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 2 } });
  });

  it('drops the cached pages when the data editor sends the user back', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const requestUrl = 'https://five.epicollect.net/api/internal/entries/demo?form_ref=form_1&page=2';

    await setCachedEntriesPage({
      projectRef: 'demo',
      requestUrl,
      payload: { data: [], meta: {}, links: {} }
    });

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: false,
      page: 1,
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(await getCachedEntriesPage({ projectRef: 'demo', requestUrl })).toBe(null);
    expect(tableStore.loadEntries).toHaveBeenCalledWith({ params: { page: 1 } });
  });

  it('falls back to the owner view when the entry the restored branch belongs to is gone', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    let loadCount = 0;
    tableStore.loadEntries = vi.fn(() => {
      loadCount += 1;
      tableStore.isRejectedPage = loadCount === 1;
      tableStore.errorStatus = loadCount === 1 ? 404 : 0;

      return Promise.resolve();
    });
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Parent entry',
      page: 2,
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(tableStore.loadEntries).toHaveBeenCalledTimes(2);
    expect(navigationStore.isViewingBranch).toBe(false);
    expect(navigationStore.currentBranchRef).toBe(null);
    expect(tableStore.branchReturnView).toBe(null);
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 2 } });
    expect(toastStore.toast.isOpen).toBe(true);
    expect(toastStore.toast.message).toContain('no longer available');
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
  });

  it('falls back to the parent form when the restored child view lost its entry', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const filtersStore = useFiltersStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();

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

    let loadCount = 0;
    tableStore.loadEntries = vi.fn(() => {
      loadCount += 1;
      tableStore.isRejectedPage = loadCount === 1;
      tableStore.errorStatus = loadCount === 1 ? 404 : 0;

      return Promise.resolve();
    });
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_2',
      formName: 'Form 2',
      parentFormRef: 'form_2',
      hierarchyNavigator: [
        { formRef: 'form_1', formName: 'Form 1' },
        { formRef: 'form_2', formName: 'Form 2', parentEntryUuid: 'entry-1', parentEntryTitle: 'Parent entry' }
      ],
      isViewingChildren: true,
      isViewingBranch: false,
      page: 2,
      entriesFilters: {
        filterByTitle: 'river',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(tableStore.loadEntries).toHaveBeenCalledTimes(2);
    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(navigationStore.isViewingChildren).toBe(false);
    expect(filtersStore.filterByTitle).toBe('');
    expect(tableStore.loadEntries).toHaveBeenLastCalledWith({ params: { page: 1 } });
    expect(toastStore.toast.isOpen).toBe(true);
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
  });

  it('keeps the saved view for a retry when the restored page fails without a status', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    tableStore.loadEntries = vi.fn(() => {
      tableStore.isRejectedPage = true;
      tableStore.errorStatus = 0;

      return Promise.resolve();
    });
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: true,
      branchRef: 'branch_1',
      branchOwnerUuid: 'entry-1',
      branchOwnerEntryTitle: 'Parent entry',
      page: 1,
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(tableStore.loadEntries).toHaveBeenCalledTimes(1);
    expect(navigationStore.isViewingBranch).toBe(true);
    expect(toastStore.toast.isOpen).toBe(false);
    expect(localStorage.getItem('epicollect5-restore')).not.toBe(null);
  });

  it('comes back to the map page after editing an entry from the map drawer', async () => {
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

    router.push('/project/demo/data?restore=1');
    await router.isReady();

    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    tableStore.loadEntries = vi.fn().mockResolvedValue();
    tableStore.links = { prev: null, next: null };
    localStorage.setItem('epicollect5-restore', JSON.stringify({
      projectSlug: 'demo',
      savedAt: Date.now(),
      formRef: 'form_1',
      formName: 'Form 1',
      parentFormRef: 'form_1',
      hierarchyNavigator: [{ formRef: 'form_1', formName: 'Form 1' }],
      isViewingChildren: false,
      isViewingBranch: false,
      branchRef: null,
      branchOwnerUuid: null,
      branchOwnerEntryTitle: null,
      branchBackLink: null,
      page: 1,
      activePage: 'map',
      entriesFilters: {
        filterByTitle: '',
        startDate: '',
        endDate: '',
        selectedOrderBy: 'Newest',
        sortBy: 'created_at',
        sortOrder: 'DESC'
      }
    }));

    mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(navigationStore.activePage).toBe('map');
    expect(navigationStore.currentFormRef).toBe('form_1');
    expect(localStorage.getItem('epicollect5-restore')).toBe(null);
  });

  it('adds an entry from the secondary navbar for the view the table is showing', async () => {
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
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    projectStore.projectSlug = 'demo';
    projectStore.isFetching = false;
    projectStore.isRejected = false;
    projectStore.projectUser = { id: 1, role: 'curator' };
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    projectStore.projectExtra = {
      forms: {
        form_1: { inputs: ['q1'], group: {}, branch: {} }
      },
      inputs: {
        q1: { data: { ref: 'q1', question: 'Q1' } }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    filtersStore.setTitle('river');
    tableStore.pagination = {
      total: 1,
      current_page: 3,
      last_page: 4
    };
    tableStore.links = { prev: 'https://five.epicollect.net/api/internal/entries/demo?page=2', next: null };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    const wrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    const addButton = wrapper.get('.table-view__add-entry');
    expect(addButton.text()).toContain('Add Form 1');

    await addButton.trigger('click');

    const openedUrl = new URL(openSpy.mock.calls[0][0]);
    const savedParams = JSON.parse(localStorage.getItem('epicollect5-restore'));

    expect(openedUrl.pathname).toBe('/add-entry');
    expect(openedUrl.searchParams.get('form_ref')).toBe('form_1');
    expect(openedUrl.searchParams.get('title')).toBe('river');
    //the add goes back to the page and filters the user is looking at
    expect(savedParams).toEqual(expect.objectContaining({
      formRef: 'form_1',
      page: 3,
      entriesFilters: expect.objectContaining({ filterByTitle: 'river' })
    }));

    openSpy.mockRestore();
  });

  it('hides the navbar add action from viewers and empty forms', async () => {
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
    projectStore.projectUser = { id: 1, role: 'viewer' };
    projectStore.projectDefinition = {
      project: {
        forms: [{ ref: 'form_1', name: 'Form 1' }]
      }
    };
    projectStore.projectExtra = {
      forms: {
        form_1: { inputs: ['q1'], group: {}, branch: {} }
      },
      inputs: {
        q1: { data: { ref: 'q1', question: 'Q1' } }
      }
    };

    navigationStore.setCurrentForm('form_1', 'Form 1');
    tableStore.pagination = {
      total: 1,
      current_page: 1,
      last_page: 1
    };
    tableStore.links = { prev: null, next: null };
    tableStore.loadEntries = vi.fn().mockResolvedValue();

    const viewerWrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(viewerWrapper.find('.table-view__add-entry').exists()).toBe(false);

    //a collector gets the action back only once the form has questions
    projectStore.projectUser = { id: 1, role: 'collector' };
    projectStore.projectExtra.forms.form_1.inputs = [];

    const emptyFormWrapper = mount(PageTable, {
      global: {
        plugins: [router, pinia]
      }
    });

    await flushPromises();

    expect(emptyFormWrapper.find('.table-view__add-entry').exists()).toBe(false);
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
