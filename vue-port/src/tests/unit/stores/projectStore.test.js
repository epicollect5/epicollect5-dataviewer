import { createPinia, setActivePinia } from 'pinia';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';

const { fetchProject } = vi.hoisted(() => ({
  fetchProject: vi.fn()
}));

vi.mock('@/services/api/projectApi', () => ({
  fetchProject
}));

describe('projectStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchProject.mockReset();
  });

  it('hydrates project extra from the project definition payload', async () => {
    const store = useProjectStore();
    const navigationStore = useNavigationStore();
    const projectExtra = {
      forms: {
        form_1: {
          lists: {
            multiple_choice_inputs: {
              form: {
                order: ['choice_1'],
                choice_1: {
                  possible_answers: {
                    answer_1: 'Yes'
                  }
                }
              },
              branch: {}
            }
          }
        }
      }
    };

    fetchProject.mockResolvedValue({
      data: {
        data: {
          project: {
            forms: [
              {
                ref: 'form_1',
                name: 'Form 1'
              }
            ]
          },
          project_extra: projectExtra
        },
        meta: {}
      }
    });

    await store.loadProject('demo');

    expect(store.projectExtra).toStrictEqual(projectExtra);
    expect(navigationStore.currentFormRef).toBe('form_1');
  });
});
