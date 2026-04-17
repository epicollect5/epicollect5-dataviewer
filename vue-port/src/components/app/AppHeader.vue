<template>
  <ion-header translucent class="primary-navbar">
    <ion-toolbar>
      <div class="primary-navbar__inner">
        <div class="primary-navbar__brand">
          <a :href="projectHomeUrl" class="primary-navbar__brand-link">
            <img class="primary-navbar__project-logo" :src="projectLogoSrc" :alt="projectName" @error="handleLogoError" />
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
              <img class="primary-navbar__avatar" :src="avatarSrc" alt="avatar" @error="handleAvatarError" />
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

<script setup>
import { IonHeader, IonIcon, IonToolbar } from '@ionic/vue';
import { cloudDownload, globe, grid, logIn, logOut, power } from 'ionicons/icons';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PARAMETERS from '@/config/parameters';
import { useDrawerStore } from '@/stores/drawerStore';
import { useMapStore } from '@/stores/mapStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import helpers from '@/utils/helpers';

const route = useRoute();
const router = useRouter();
const drawerStore = useDrawerStore();
const projectStore = useProjectStore();
const navigationStore = useNavigationStore();
const tableStore = useTableStore();
const mapStore = useMapStore();

const isMapPage = computed(() => route.path.includes('/map'));
const isLocalhost = computed(() => ['localhost', '127.0.0.1'].includes(window.location.hostname));
const currentProjectSlug = computed(() => {
  return projectStore.projectDefinition.project?.slug || route.params.projectSlug || route.query.project || '';
});
const projectName = computed(() => projectStore.projectDefinition.project?.name || 'Epicollect5');
const currentFormRef = computed(() => navigationStore.currentFormRef);
const forms = computed(() => projectStore.forms);
const isLoggedIn = computed(() => {
  const user = projectStore.projectUser || {};
  return (user.role !== null && user.role !== undefined) || (user.id !== null && user.id !== undefined);
});
const showDownloadButton = computed(() => isLocalhost.value || isLoggedIn.value);
const userName = computed(() => projectStore.projectUser?.name || 'User');
const loginHref = computed(() => `${PARAMETERS.SERVER_URL}/login`);
const logoutHref = computed(() => `${PARAMETERS.SERVER_URL}${isLocalhost.value ? '/login' : '/logout'}`);
const projectHomeUrl = computed(() => {
  return currentProjectSlug.value
    ? `${PARAMETERS.SERVER_URL}${PARAMETERS.PROJECT_HOME_PATH}${currentProjectSlug.value}`
    : PARAMETERS.SERVER_URL;
});
const projectLogoUrl = computed(() => {
  if (!currentProjectSlug.value) {
    return '/favicon.png';
  }

  const version = projectStore.projectStats?.structure_last_updated
    ? Math.floor(new Date(projectStore.projectStats.structure_last_updated).getTime() / 1000)
    : Date.now();

  return `${PARAMETERS.SERVER_URL}${PARAMETERS.API_MEDIA_ENDPOINT}${currentProjectSlug.value}${PARAMETERS.PROJECT_LOGO_QUERY_STRING}&v=${version}`;
});
const projectLogoSrc = ref(projectLogoUrl.value);
const tableHref = computed(() => {
  if (route.params.projectSlug) {
    return `/${route.params.projectSlug}/data`;
  }

  if (currentProjectSlug.value) {
    return `/table?project=${currentProjectSlug.value}`;
  }

  return '/table';
});
const mapHref = computed(() => {
  if (route.params.projectSlug) {
    return `/${route.params.projectSlug}/data/map`;
  }

  if (currentProjectSlug.value) {
    return `/map?project=${currentProjectSlug.value}`;
  }

  return '/map';
});
const fallbackAvatarSrc = computed(() => `${PARAMETERS.SERVER_URL}${PARAMETERS.IMAGES_PATH_LARAVEL}avatar-placeholder.png`);
const avatarSrc = ref(projectStore.projectUser?.avatar || fallbackAvatarSrc.value);

watch(
  projectLogoUrl,
  (nextLogoUrl) => {
    projectLogoSrc.value = nextLogoUrl || '/favicon.png';
  },
  { immediate: true }
);

watch(
  () => [projectStore.projectUser?.avatar, fallbackAvatarSrc.value],
  ([nextAvatar, nextFallback]) => {
    avatarSrc.value = nextAvatar || nextFallback;
  },
  { immediate: true }
);

const handleLogoError = () => {
  projectLogoSrc.value = '/favicon.png';
};

const handleAvatarError = () => {
  avatarSrc.value = fallbackAvatarSrc.value;
};

const navigateToPage = async (page) => {
  drawerStore.close();
  navigationStore.setActivePage(page);
  await router.push(page === 'map' ? mapHref.value : tableHref.value);
};

const handleFormChange = async (formRef) => {
  const nextForm = projectStore.forms.find((form) => form.ref === formRef);
  if (!nextForm || nextForm.ref === navigationStore.currentFormRef) {
    return;
  }

  navigationStore.setCurrentForm(nextForm.ref, nextForm.name);
  drawerStore.close();

  if (isMapPage.value) {
    await mapStore.loadLocations({ resetFilters: true });
    return;
  }

  await tableStore.loadEntries({ params: { page: 1 } });
};

const handleDownload = () => {
  if (!currentProjectSlug.value) {
    return;
  }

  const availableMappings = Array.isArray(projectStore.projectMapping)
    ? projectStore.projectMapping
    : Object.values(projectStore.projectMapping || {});
  const activeMapping = helpers.getDefaultMapping(availableMappings) || availableMappings[0] || {};
  const params = isMapPage.value
    ? {
        form_ref: currentFormRef.value,
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

  window.location.href = `${PARAMETERS.SERVER_URL}${PARAMETERS.API_DOWNLOAD_ENDPOINT}${currentProjectSlug.value}?${query.toString()}`;
};
</script>
