import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import ModalDeleteEntry from '@/components/entry/ModalDeleteEntry.vue';
import { canEditEntryForProjectUser } from '@/services/entries/dataEditorFlow';
import { useDrawerStore } from '@/stores/drawerStore';
import { useModalStore } from '@/stores/modalStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';

vi.mock('@/services/entries/dataEditorFlow', () => ({
  canEditEntryForProjectUser: vi.fn(() => true)
}));

const PAYLOAD = {
  entryUuid: 'entry-1',
  entryTitle: 'River crossing',
  entryExtra: {
    attributes: {},
    relationships: { user: { data: { id: 7 } } }
  }
};

describe('components/entry/ModalDeleteEntry', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    canEditEntryForProjectUser.mockClear();
    canEditEntryForProjectUser.mockReturnValue(true);
  });

  it('refuses to delete an entry the project user is not allowed to delete', async () => {
    const modalStore = useModalStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();
    const deleteSpy = vi.spyOn(tableStore, 'deleteCurrentEntry').mockResolvedValue();

    canEditEntryForProjectUser.mockReturnValue(false);
    modalStore.open('delete-entry', PAYLOAD);

    const wrapper = mount(ModalDeleteEntry);

    expect(wrapper.vm.canDelete).toBe(false);
    expect(canEditEntryForProjectUser).toHaveBeenCalledWith({ relationships: PAYLOAD.entryExtra.relationships });

    await wrapper.vm.confirmDelete();

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(modalStore.activeModal).toBe(null);
    expect(toastStore.toast).toEqual(expect.objectContaining({
      isOpen: true,
      message: 'You do not have permission to delete this entry.',
      color: 'danger'
    }));
  });

  it('closes the map entry drawer once the entry is gone', async () => {
    const modalStore = useModalStore();
    const tableStore = useTableStore();
    const drawerStore = useDrawerStore();

    vi.spyOn(tableStore, 'deleteCurrentEntry').mockResolvedValue();
    drawerStore.open('map-entry', { side: 'left' });
    modalStore.open('delete-entry', PAYLOAD);

    const wrapper = mount(ModalDeleteEntry);

    await wrapper.vm.confirmDelete();

    expect(drawerStore.activeDrawer).toBe(null);
  });

  it('deletes the entry when the project user may edit it', async () => {
    const modalStore = useModalStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();
    const deleteSpy = vi.spyOn(tableStore, 'deleteCurrentEntry').mockResolvedValue();

    modalStore.open('delete-entry', PAYLOAD);

    const wrapper = mount(ModalDeleteEntry);

    expect(wrapper.vm.canDelete).toBe(true);

    await wrapper.vm.confirmDelete();

    expect(deleteSpy).toHaveBeenCalledWith(PAYLOAD);
    expect(toastStore.toast.message).toBe('Deleted "River crossing".');
    expect(modalStore.activeModal).toBe(null);
  });
});
