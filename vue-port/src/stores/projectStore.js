import { defineStore } from 'pinia';
import { fetchProject } from '@/services/api/projectApi';
import { useNavigationStore } from '@/stores/navigationStore';

let pendingProjectRequest = null;
let pendingProjectSlug = '';

export const useProjectStore = defineStore('project', {
  state: () => ({
    projectSlug: '',
    projectDefinition: {},
    projectExtra: {},
    projectUser: {},
    projectStats: {},
    projectMapping: [],
    entriesExtra: [],
    errors: [],
    isFetching: false,
    isFulfilled: false,
    isRejected: false
  }),
  getters: {
    forms(state) {
      return state.projectDefinition.project?.forms || [];
    }
  },
  actions: {
    async loadProject(projectSlug) {
      if (!projectSlug) {
        this.errors = ['Project slug is required.'];
        this.isRejected = true;
        return false;
      }

      if (pendingProjectRequest && pendingProjectSlug === projectSlug) {
        return pendingProjectRequest;
      }

      this.projectSlug = projectSlug;
      this.isFetching = true;
      this.isRejected = false;
      this.errors = [];

      pendingProjectSlug = projectSlug;
      pendingProjectRequest = (async () => {
        try {
          const response = await fetchProject(projectSlug);
          const navigationStore = useNavigationStore();
          const payload = response.data;
          const forms = payload.data.project?.forms || [];
          const firstForm = forms[0] || null;

          this.projectDefinition = payload.data;
          this.projectExtra = payload.meta.project_extra;
          this.projectUser = payload.meta.project_user;
          this.projectStats = payload.meta.project_stats;
          this.projectMapping = payload.meta.project_mapping;
          this.isFulfilled = true;

          if (firstForm) {
            navigationStore.setCurrentForm(firstForm.ref, firstForm.name);
          }

          return true;
        } catch (error) {
          this.isRejected = true;
          this.errors = error.response?.data?.errors || [error.message];
          return false;
        } finally {
          this.isFetching = false;

          if (pendingProjectSlug === projectSlug) {
            pendingProjectRequest = null;
            pendingProjectSlug = '';
          }
        }
      })();

      return pendingProjectRequest;
    }
  }
});
