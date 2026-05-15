import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import DrawerWrapper from '@/components/app/DrawerWrapper.vue';
import { useDrawerStore } from '@/stores/drawerStore';

vi.mock('@ionic/vue', async (importOriginal) => {
  const ionicVue = await importOriginal();

  return {
    ...ionicVue,
    menuController: {
      close: vi.fn(),
      enable: vi.fn(),
      isOpen: vi.fn(() => false),
      open: vi.fn()
    }
  };
});

describe('components/app/DrawerWrapper', () => {
  it('marks the map filters drawer so its Ionic backdrop can be bypassed', async () => {
    setActivePinia(createPinia());

    const drawerStore = useDrawerStore();
    drawerStore.open('map-filters', {});

    const wrapper = mount(DrawerWrapper, {
      global: {
        stubs: {
          DrawerEntry: true,
          DrawerMap: true,
          DrawerNavbarPrimary: true,
          IonIcon: true
        }
      }
    });

    expect(wrapper.vm.drawerClasses).toEqual({
      'drawer-wrapper--map-filters': true,
      'drawer-wrapper--map-interactive': true
    });

    drawerStore.open('map-entry', {});
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.drawerClasses).toEqual({
      'drawer-wrapper--map-filters': false,
      'drawer-wrapper--map-interactive': true
    });
  });
});
