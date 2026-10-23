import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import { chevronBack } from 'ionicons/icons';
import DrawerWrapper from '@/components/main/DrawerWrapper.vue';
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

describe('components/main/DrawerWrapper', () => {
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
      'drawer-wrapper--map-interactive': true,
      'drawer-wrapper--upload': false
    });

    drawerStore.open('map-entry', {});
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.drawerClasses).toEqual({
      'drawer-wrapper--map-filters': false,
      'drawer-wrapper--map-interactive': true,
      'drawer-wrapper--upload': false
    });
  });

  it('uses the legacy header treatment for the upload drawer', async () => {
    setActivePinia(createPinia());

    const drawerStore = useDrawerStore();
    const wrapper = mount(DrawerWrapper, {
      global: {
        stubs: {
          DrawerEntry: true,
          DrawerMap: true,
          DrawerNavbarPrimary: true,
          DrawerUpload: true,
          IonIcon: true
        }
      }
    });

    drawerStore.open('upload', { side: 'left' });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.drawerClasses['drawer-wrapper--upload']).toBe(true);
    expect(wrapper.vm.drawerTitle).toBe('Upload');
    expect(wrapper.vm.closeIcon).toBe(chevronBack);
  });
});
