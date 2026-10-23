<template>
  <section class="drawer-navbar-primary">
    <div v-if="showUser" class="drawer-navbar-primary__user">
      <img class="drawer-navbar-primary__avatar" :src="avatarSrc" alt="avatar" @error="emitAvatarError" />
      <span>Hi,<strong> {{ userName }}</strong></span>
    </div>

    <nav class="drawer-navbar-primary__nav" aria-label="Primary navigation">
      <a v-if="showLoginLink" class="drawer-navbar-primary__link" :href="loginHref">
        <ion-icon :icon="logIn" />
        <span>Login</span>
      </a>

      <a v-if="showLogoutLink" class="drawer-navbar-primary__link" :href="logoutHref">
        <ion-icon :icon="logOut" />
        <span>Logout</span>
      </a>

      <button
        v-if="canShowDownloadButton"
        type="button"
        class="drawer-navbar-primary__link"
        @click="emitDownload"
      >
        <ion-icon :icon="cloudDownload" />
        <span>Download</span>
      </button>

      <button
        type="button"
        class="drawer-navbar-primary__link"
        :class="tableLinkClasses"
        @click="emitNavigateToTable"
      >
        <ion-icon :icon="grid" />
        <span>Table</span>
      </button>

      <button
        type="button"
        class="drawer-navbar-primary__link"
        :class="mapLinkClasses"
        @click="emitNavigateToMap"
      >
        <ion-icon :icon="globe" />
        <span>Map</span>
      </button>

      <a class="drawer-navbar-primary__link" :href="projectHomeUrl">
        <ion-icon :icon="power" />
        <span>Exit</span>
      </a>
    </nav>
  </section>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { cloudDownload, globe, grid, logIn, logOut, power } from 'ionicons/icons';
import { computed } from 'vue';

export default {
  name: 'DrawerNavbarPrimary',
  components: {
    IonIcon
  },
  props: {
    avatarSrc: {
      type: String,
      default: ''
    },
    isLoggedIn: {
      type: Boolean,
      default: false
    },
    isMapPage: {
      type: Boolean,
      default: false
    },
    loginHref: {
      type: String,
      default: ''
    },
    logoutHref: {
      type: String,
      default: ''
    },
    projectHomeUrl: {
      type: String,
      default: ''
    },
    showDownloadButton: {
      type: Boolean,
      default: false
    },
    userName: {
      type: String,
      default: 'User'
    }
  },
  emits: ['avatar-error', 'download', 'navigate-page'],
  setup(props, { emit }) {
    const methods = {
      emitAvatarError() {
        emit('avatar-error');
      },
      emitDownload() {
        emit('download');
      },
      emitNavigate(page) {
        emit('navigate-page', page);
      },
      emitNavigateToTable() {
        methods.emitNavigate('table');
      },
      emitNavigateToMap() {
        methods.emitNavigate('map');
      }
    };

    const computedScope = {
      showUser: computed(() => props.isLoggedIn),
      showLoginLink: computed(() => !props.isLoggedIn),
      showLogoutLink: computed(() => props.isLoggedIn),
      canShowDownloadButton: computed(() => props.showDownloadButton),
      tableLinkClasses: computed(() => ({
        'drawer-navbar-primary__link--active': !props.isMapPage
      })),
      mapLinkClasses: computed(() => ({
        'drawer-navbar-primary__link--active': props.isMapPage
      }))
    };

    const icons = {
      cloudDownload,
      globe,
      grid,
      logIn,
      logOut,
      power
    };

    return {
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/app/DrawerNavbarPrimary.scss" lang="scss"></style>
