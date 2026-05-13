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
          <Dropdown
            :model-value="currentFormRef || ''"
            :options="forms"
            option-label-key="name"
            option-value-key="ref"
            @change="handleFormChange"
          />
        </label>

        <button
          type="button"
          class="primary-navbar__menu-toggle"
          aria-label="Open primary navigation"
          @click="openPrimaryDrawer"
        >
          <ion-icon :icon="menu" />
        </button>

        <nav class="primary-navbar__nav" aria-label="Primary navigation">
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

          <button
            v-if="showDownloadButton"
            type="button"
            class="primary-navbar__nav-link"
            @click="openDownloadDrawer"
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
        </nav>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<script>
import { IonHeader, IonIcon, IonToolbar } from '@ionic/vue';
import { cloudDownload, globe, grid, logIn, logOut, menu, power } from 'ionicons/icons';
import { computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import PARAMETERS from '@/core/config/parameters';
import Dropdown from '@/components/global/Dropdown.vue';
import { useDrawerStore } from '@/stores/drawerStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import helpers from '@/utils/helpers';

export default {
  name: 'NavbarPrimary',
  components: {
    Dropdown,
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
        state.avatarSrc = computedScope.fallbackAvatarSrc.value;
      },
      handlePrimaryDrawerEvent(eventName, value) {
        if (eventName === 'avatar-error') {
          methods.handleAvatarError();
          return;
        }

        if (eventName === 'download') {
          drawerStore.close();
          methods.openDownloadDrawer();
          return;
        }

        if (eventName === 'navigate-page') {
          methods.navigateToPage(value);
          drawerStore.close();
        }
      },
      openPrimaryDrawer() {
        drawerStore.open('navbar-primary', {
          side: 'right',
          avatarSrc: state.avatarSrc,
          isLoggedIn: computedScope.isLoggedIn.value,
          isMapPage: computedScope.isMapPage.value,
          loginHref: computedScope.loginHref.value,
          logoutHref: computedScope.logoutHref.value,
          projectHomeUrl: computedScope.projectHomeUrl.value,
          showDownloadButton: computedScope.showDownloadButton.value,
          userName: computedScope.userName.value,
          onEvent: methods.handlePrimaryDrawerEvent
        });
      },
      async navigateToPage(page) {
        drawerStore.close();
        if (page === 'map' && navigationStore.activePage !== 'map' && navigationStore.isFirstMapLoad) {
          navigationStore.setBusy(true);
        }
        navigationStore.setActivePage(page);
      },
      async handleFormChange(formRef) {
        const nextForm = projectStore.forms.find((form) => form.ref === formRef);
        if (!nextForm || nextForm.ref === navigationStore.currentFormRef) {
          return;
        }

        navigationStore.setCurrentForm(nextForm.ref, nextForm.name);
        drawerStore.close();

        if (computedScope.isMapPage.value) {
          await mapStore.loadLocations({ resetFilters: true });
          return;
        }

        await tableStore.loadEntries({ params: { page: 1 } });
        void mapStore.loadLocations({ resetFilters: true });
      },
      openDownloadDrawer() {
        if (!computedScope.currentProjectSlug.value) {
          return;
        }

        const formStats = projectStore.projectStats?.form_counts?.[navigationStore.currentFormRef];
        const firstEntryDate = formStats?.first_entry_created || new Date().toISOString();
        const lastEntryDate = formStats?.last_entry_created || new Date().toISOString();

        const availableMappings = Array.isArray(projectStore.projectMapping)
          ? projectStore.projectMapping
          : Object.values(projectStore.projectMapping || {});
        const defaultMapping = helpers.getDefaultMapping(availableMappings) || availableMappings[0] || {};

        drawerStore.open('app-download', {
          side: 'left',
          projectMapping: projectStore.projectMapping,
          projectSlug: computedScope.currentProjectSlug.value,
          currentFormRef: navigationStore.currentFormRef,
          firstEntryDate,
          lastEntryDate,
          defaultMapping,
          onEvent: methods.handleDownloadDrawerEvent
        });
      },
      handleDownloadDrawerEvent(eventName, value) {
        if (eventName === 'download') {
          methods.doDownload(value);
          drawerStore.close();
        }
      },
      doDownload(params) {
        const endpoint = `${PARAMETERS.SERVER_URL}${PARAMETERS.API_DOWNLOAD_ENDPOINT}${computedScope.currentProjectSlug.value}`;

        const queryParams = {
          map_index: params.map_index,
          format: params.format
        };

        const customState = {
          selectedStartDate: params.selectedStartDate ? new Date(params.selectedStartDate) : new Date(),
          selectedEndDate: params.selectedEndDate ? new Date(params.selectedEndDate) : new Date()
        };

        const timeframeQuery = helpers.getTimeframeParams(params.activeTimeframe, customState);
        Object.assign(queryParams, timeframeQuery);

        const query = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query.set(key, value);
          }
        });

        window.location.href = `${endpoint}?${query.toString()}`;
      }
    };

    const computedScope = {
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
      showDownloadButton: computed(() => computedScope.isLocalhost.value || computedScope.isLoggedIn.value),
      userName: computed(() => projectStore.projectUser?.name || 'User'),
      loginHref: computed(() => `${PARAMETERS.SERVER_URL}/login`),
      logoutHref: computed(() => `${PARAMETERS.SERVER_URL}${computedScope.isLocalhost.value ? '/login' : '/logout'}`),
      projectHomeUrl: computed(() => {
        return computedScope.currentProjectSlug.value
          ? `${PARAMETERS.SERVER_URL}${PARAMETERS.PROJECT_HOME_PATH}${computedScope.currentProjectSlug.value}`
          : PARAMETERS.SERVER_URL;
      }),
      projectLogoUrl: computed(() => {
        if (!computedScope.currentProjectSlug.value) {
          return '/favicon.png';
        }

        const version = projectStore.projectStats?.structure_last_updated
          ? Math.floor(new Date(projectStore.projectStats.structure_last_updated).getTime() / 1000)
          : Date.now();

        return `${PARAMETERS.SERVER_URL}${PARAMETERS.API_MEDIA_ENDPOINT}${computedScope.currentProjectSlug.value}${PARAMETERS.PROJECT_LOGO_QUERY_STRING}&v=${version}`;
      }),
      tableHref: computed(() => {
        if (route.params.projectSlug !== undefined) {
          return route.params.projectSlug
            ? `/project/${route.params.projectSlug}/data`
            : '/project/data';
        }

        if (computedScope.currentProjectSlug.value) {
          return `/project/${computedScope.currentProjectSlug.value}/data`;
        }

        return '/project/data';
      }),
      fallbackAvatarSrc: computed(() => `${PARAMETERS.SERVER_URL}${PARAMETERS.IMAGES_PATH_LARAVEL}avatar-placeholder.png`)
    };

    watch(
      computedScope.projectLogoUrl,
      (nextLogoUrl) => {
        state.projectLogoSrc = nextLogoUrl || '/favicon.png';
      },
      { immediate: true }
    );

    watch(
      () => [projectStore.projectUser?.avatar, computedScope.fallbackAvatarSrc.value],
      ([nextAvatar, nextFallback]) => {
        state.avatarSrc = nextAvatar || nextFallback;
      },
      { immediate: true }
    );

    return {
      state,
      ...methods,
      ...computedScope,
      cloudDownload,
      globe,
      grid,
      logIn,
      logOut,
      menu,
      power
    };
  }
};
</script>
<style src="@/theme/app/NavbarPrimary.scss" lang="scss"></style>
