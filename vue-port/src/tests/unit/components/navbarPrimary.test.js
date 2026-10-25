import { createPinia, setActivePinia } from 'pinia';
import { flushPromises, mount } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import NavbarPrimary from '@/components/main/NavbarPrimary.vue';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

const createTestRouter = async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/project/:projectSlug?/data',
        component: { template: '<div />' }
      }
    ]
  });

  await router.push('/project/demo/data');
  await router.isReady();

  return router;
};

const mountNavbar = async (pinia) => {
  const router = await createTestRouter();
  const wrapper = mount(NavbarPrimary, {
    global: {
      plugins: [pinia, router]
    }
  });

  await flushPromises();

  return wrapper;
};

const setProject = () => {
  const projectStore = useProjectStore();

  projectStore.projectDefinition = {
    project: {
      name: 'Demo project',
      slug: 'demo',
      forms: [
        { ref: 'form_1', name: 'Form One' },
        { ref: 'form_2', name: 'Form Two' }
      ]
    }
  };

  return projectStore;
};

describe('components/main/NavbarPrimary', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('shows the form switcher and navigation on the project root view', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    setProject();

    const navigationStore = useNavigationStore();
    navigationStore.setCurrentForm('form_1', 'Form One');

    const wrapper = await mountNavbar(pinia);

    expect(wrapper.find('.primary-navbar__forms').exists()).toBe(true);
    expect(wrapper.find('.primary-navbar__nav').exists()).toBe(true);
    expect(wrapper.find('.primary-navbar__child-entry-title').exists()).toBe(false);
  });

  it('shows only the brand and the parent entry title while viewing children', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    setProject();

    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const navigateToRoot = vi.spyOn(tableStore, 'navigateToRoot').mockResolvedValue();

    navigationStore.setCurrentForm('form_1', 'Form One');
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form Two',
      parentEntryUuid: 'entry-1',
      parentEntryTitle: 'Parent entry'
    });

    const wrapper = await mountNavbar(pinia);

    expect(wrapper.find('.primary-navbar__brand').exists()).toBe(true);
    expect(wrapper.find('.primary-navbar__forms').exists()).toBe(false);
    expect(wrapper.find('.primary-navbar__menu-toggle').exists()).toBe(false);
    expect(wrapper.find('.primary-navbar__nav').exists()).toBe(false);
    expect(wrapper.find('.primary-navbar__child-entry-title').text()).toBe('Form Two of "Parent entry"');
    expect(wrapper.find('.primary-navbar__child-entry-title').attributes('title')).toBe('Form Two of "Parent entry"');

    const brandLink = wrapper.find('.primary-navbar__brand-link');
    expect(brandLink.attributes('href')).toBe('/project/demo/data');
    expect(brandLink.attributes('aria-label')).toBe('Back to the first form');

    await brandLink.trigger('click');

    expect(navigateToRoot).toHaveBeenCalledTimes(1);
  });
});
