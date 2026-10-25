import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import DrawerEntry from '@/components/entry/DrawerEntry.vue';
import {
  canEditEntryForProjectUser,
  openEditEntry
} from '@/services/entries/dataEditorFlow';
import { useMapStore } from '@/stores/mapStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

vi.mock('@/services/entries/dataEditorFlow', () => ({
  canEditEntryForProjectUser: vi.fn(() => true),
  openEditEntry: vi.fn()
}));

const RELATIONSHIPS = { user: { data: { id: 7 } } };

const seedStores = () => {
  const projectStore = useProjectStore();
  const navigationStore = useNavigationStore();
  const mapStore = useMapStore();

  projectStore.projectSlug = 'demo';
  projectStore.projectExtra = {
    forms: {
      form_1: { inputs: ['q1'], group: {}, branch: {} },
      form_2: { inputs: ['q2'], group: {}, branch: {} }
    },
    inputs: {
      q1: { data: { ref: 'q1', type: 'text', question: 'Q1' } },
      q2: { data: { ref: 'q2', type: 'text', question: 'Q2' } }
    }
  };
  navigationStore.setCurrentForm('form_1', 'Form 1');
  mapStore.lastLoadedFormRef = 'form_1';
  mapStore.selectedEntry = {
    data: {
      entries: [
        {
          entry: {
            entry_uuid: 'entry-1',
            title: 'River crossing',
            created_at: '2024-04-10 10:00:00',
            answers: { q1: { answer: 'Alpha' } }
          },
          attributes: { child_counts: null, branch_counts: {} },
          relationships: RELATIONSHIPS
        }
      ]
    }
  };
};

describe('components/entry/DrawerEntry', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    canEditEntryForProjectUser.mockClear();
    canEditEntryForProjectUser.mockReturnValue(true);
    openEditEntry.mockClear();
  });

  it('edits the map entry through the data editor round trip', async () => {
    seedStores();
    const wrapper = mount(DrawerEntry);
    const editButton = wrapper.get('[aria-label="Edit entry"]');

    expect(canEditEntryForProjectUser).toHaveBeenCalledWith({ relationships: RELATIONSHIPS });
    expect(editButton.attributes('disabled')).toBeUndefined();

    await editButton.trigger('click');

    expect(openEditEntry).toHaveBeenCalledWith({ entryUuid: 'entry-1' });
  });

  it('deletes the map entry through the shared delete modal', async () => {
    seedStores();
    const modalStore = useModalStore();
    const wrapper = mount(DrawerEntry);

    await wrapper.get('[aria-label="Delete entry"]').trigger('click');

    expect(modalStore.activeModal).toBe('delete-entry');
    expect(modalStore.payload).toEqual({
      entryUuid: 'entry-1',
      entryTitle: 'River crossing',
      entryExtra: {
        attributes: { child_counts: null, branch_counts: {} },
        relationships: RELATIONSHIPS
      }
    });
  });

  it('parses the clicked entry with the form the locations were loaded for', () => {
    seedStores();
    const navigationStore = useNavigationStore();
    const mapStore = useMapStore();

    //a restored map keeps the hierarchy root form while the table shows a child form
    navigationStore.enterChildForm({
      formRef: 'form_2',
      formName: 'Form 2',
      parentEntryUuid: 'entry-0',
      parentEntryTitle: 'Parent entry'
    });
    mapStore.lastLoadedFormRef = 'form_1';

    const wrapper = mount(DrawerEntry);

    expect(wrapper.text()).toContain('Q1');
    expect(wrapper.text()).toContain('Alpha');
    expect(wrapper.text()).not.toContain('Q2');
  });

  it('disables both actions when the project user may not edit the entry', () => {
    seedStores();
    canEditEntryForProjectUser.mockReturnValue(false);

    const wrapper = mount(DrawerEntry);

    expect(wrapper.get('[aria-label="Edit entry"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Delete entry"]').attributes('disabled')).toBeDefined();
  });
});
