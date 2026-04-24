<template>
  <ion-header translucent class="primary-navbar">
    <ion-toolbar>
      <div class="primary-navbar__inner">
        <div class="primary-navbar__brand">
          <a :href="projectHomeUrl" class="primary-navbar__brand-link">
            <img class="primary-navbar__project-logo" :src="state.projectLogoSrc" :alt="projectName" @error="handleLogoError" />
          </a>
          <span class="primary-navbar__project-name">{{ projectName }}</span>
        </div>

        <label v-if="forms.length > 0" class="primary-navbar__forms">
          <select :value="currentFormRef || ''" @change="handleFormChange($event.target.value)">
            <option v-for="form in forms" :key="form.ref" :value="form.ref">
              {{ form.name }}
            </option>
          </select>
        </label>

        <nav class="primary-navbar__nav" aria-label="Primary navigation">
          <button
            v-if="showDownloadButton"
            type="button"
            class="primary-navbar__nav-link"
            @click="handleDownload"
          >
            <ion-icon :icon="cloudDownload" />
            <span>Download</span>
          </button>

          <button
            type="button"
            class="primary-navbar__nav-link"
            :class="{ 'primary-navbar__nav-link--active': !isMapPage }"
            @click="navigateToPage('table')"
          >
            <ion-icon :icon="grid" />
            <span>Table</span>
          </button>

          <button
            type="button"
            class="primary-navbar__nav-link"
            :class="{ 'primary-navbar__nav-link--active': isMapPage }"
            @click="navigateToPage('map')"
          >
            <ion-icon :icon="globe" />
            <span>Map</span>
          </button>

          <a class="primary-navbar__nav-link" :href="projectHomeUrl">
            <ion-icon :icon="power" />
            <span>Exit</span>
          </a>

          <template v-if="isLoggedIn">
            <span class="primary-navbar__user">
              <img class="primary-navbar__avatar" :src="state.avatarSrc" alt="avatar" @error="handleAvatarError" />
              <span>Hi,<strong> {{ userName }}</strong></span>
            </span>
            <a class="primary-navbar__nav-link" :href="logoutHref">
              <ion-icon :icon="logOut" />
              <span>Logout</span>
            </a>
          </template>

          <a v-else class="primary-navbar__nav-link" :href="loginHref">
            <ion-icon :icon="logIn" />
            <span>Login</span>
          </a>
        </nav>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<script>
import { IonHeader, IonIcon, IonToolbar } from '@ionic/vue';
import { cloudDownload, globe, grid, logIn, logOut, power } from 'ionicons/icons';
import { computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import PARAMETERS from '@/core/config/parameters';
import { useDrawerStore } from '@/stores/drawerStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import helpers from '@/utils/helpers';

export default {
  name: 'PrimaryNavbar',
  components: {
    IonHeader,
    IonIcon,
    IonToolbar
  },
  setup() {
    const route = useRoute();
    const drawerStore = useDrawerStore();
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();
    const mapStore = useMapStore();

    const state = reactive({
      drawerStore,
      projectStore,
      navigationStore,
      tableStore,
      mapStore,
      projectLogoSrc: '/favicon.png',
      avatarSrc: ''
    });

    const methods = {
      handleLogoError() {
        state.projectLogoSrc = '/favicon.png';
      },
      handleAvatarError() {
        state.avatarSrc = computedState.fallbackAvatarSrc.value;
      },
      async navigateToPage(page) {
        drawerStore.close();
        navigationStore.setActivePage(page);
      },
      async handleFormChange(formRef) {
        const nextForm = projectStore.forms.find((form) => form.ref === formRef);
        if (!nextForm || nextForm.ref === navigationStore.currentFormRef) {
          return;
        }

        navigationStore.setCurrentForm(nextForm.ref, nextForm.name);
        drawerStore.close();

        if (computedState.isMapPage.value) {
          await mapStore.loadLocations({ resetFilters: true });
          return;
        }

        await tableStore.loadEntries({ params: { page: 1 } });
        void mapStore.loadLocations({ resetFilters: true });
      },
      handleDownload() {
        if (!computedState.currentProjectSlug.value) {
          return;
        }

        const availableMappings = Array.isArray(projectStore.projectMapping)
          ? projectStore.projectMapping
          : Object.values(projectStore.projectMapping || {});
        const activeMapping = helpers.getDefaultMapping(availableMappings) || availableMappings[0] || {};
        const params = computedState.isMapPage.value
          ? {
              form_ref: computedState.currentFormRef.value,
              format: 'csv'
            }
          : {
              ...tableStore.buildEntriesParams(),
              format: 'csv'
            };

        if (activeMapping.map_index !== undefined) {
          params.map_index = activeMapping.map_index;
        }

        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query.set(key, value);
          }
        });

        window.location.href = `${PARAMETERS.SERVER_URL}${PARAMETERS.API_DOWNLOAD_ENDPOINT}${computedState.currentProjectSlug.value}?${query.toString()}`;
      }
    };

    const computedState = {
      isMapPage: computed(() => navigationStore.activePage === 'map'),
      isLocalhost: computed(() => ['localhost', '127.0.0.1'].includes(window.location.hostname)),
      currentProjectSlug: computed(() => {
        return projectStore.projectDefinition.project?.slug || route.params.projectSlug || route.query.project || '';
      }),
      projectName: computed(() => projectStore.projectDefinition.project?.name || 'Epicollect5'),
      currentFormRef: computed(() => navigationStore.currentFormRef),
      forms: computed(() => projectStore.forms),
      isLoggedIn: computed(() => {
        const user = projectStore.projectUser || {};
        return (user.role !== null && user.role !== undefined) || (user.id !== null && user.id !== undefined);
      }),
      showDownloadButton: computed(() => computedState.isLocalhost.value || computedState.isLoggedIn.value),
      userName: computed(() => projectStore.projectUser?.name || 'User'),
      loginHref: computed(() => `${PARAMETERS.SERVER_URL}/login`),
      logoutHref: computed(() => `${PARAMETERS.SERVER_URL}${computedState.isLocalhost.value ? '/login' : '/logout'}`),
      projectHomeUrl: computed(() => {
        return computedState.currentProjectSlug.value
          ? `${PARAMETERS.SERVER_URL}${PARAMETERS.PROJECT_HOME_PATH}${computedState.currentProjectSlug.value}`
          : PARAMETERS.SERVER_URL;
      }),
      projectLogoUrl: computed(() => {
        if (!computedState.currentProjectSlug.value) {
          return '/favicon.png';
        }

        const version = projectStore.projectStats?.structure_last_updated
          ? Math.floor(new Date(projectStore.projectStats.structure_last_updated).getTime() / 1000)
          : Date.now();

        return `${PARAMETERS.SERVER_URL}${PARAMETERS.API_MEDIA_ENDPOINT}${computedState.currentProjectSlug.value}${PARAMETERS.PROJECT_LOGO_QUERY_STRING}&v=${version}`;
      }),
      tableHref: computed(() => {
        if (route.params.projectSlug !== undefined) {
          return route.params.projectSlug
            ? `/project/${route.params.projectSlug}/data`
            : '/project/data';
        }

        if (computedState.currentProjectSlug.value) {
          return `/project/${computedState.currentProjectSlug.value}/data`;
        }

        return '/project/data';
      }),
      fallbackAvatarSrc: computed(() => `${PARAMETERS.SERVER_URL}${PARAMETERS.IMAGES_PATH_LARAVEL}avatar-placeholder.png`)
    };

    watch(
      computedState.projectLogoUrl,
      (nextLogoUrl) => {
        state.projectLogoSrc = nextLogoUrl || '/favicon.png';
      },
      { immediate: true }
    );

    watch(
      () => [projectStore.projectUser?.avatar, computedState.fallbackAvatarSrc.value],
      ([nextAvatar, nextFallback]) => {
        state.avatarSrc = nextAvatar || nextFallback;
      },
      { immediate: true }
    );

    return {
      state,
      ...methods,
      ...computedState,
      cloudDownload,
      globe,
      grid,
      logIn,
      logOut,
      power
    };
  }
};
</script>
<style src="@/theme/app/PrimaryNavbar.scss" lang="scss"></style>
