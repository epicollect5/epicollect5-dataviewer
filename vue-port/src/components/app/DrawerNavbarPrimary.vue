<template>
  <section class="drawer-navbar-primary">
    <div v-if="props.isLoggedIn" class="drawer-navbar-primary__user">
      <img class="drawer-navbar-primary__avatar" :src="props.avatarSrc" alt="avatar" @error="emitAvatarError" />
      <span>Hi,<strong> {{ props.userName }}</strong></span>
    </div>

    <nav class="drawer-navbar-primary__nav" aria-label="Primary navigation">
      <a v-if="!props.isLoggedIn" class="drawer-navbar-primary__link" :href="props.loginHref">
        <ion-icon :icon="logIn" />
        <span>Login</span>
      </a>

      <a v-if="props.isLoggedIn" class="drawer-navbar-primary__link" :href="props.logoutHref">
        <ion-icon :icon="logOut" />
        <span>Logout</span>
      </a>

      <button
        v-if="props.showDownloadButton"
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
        :class="{ 'drawer-navbar-primary__link--active': !props.isMapPage }"
        @click="emitNavigate('table')"
      >
        <ion-icon :icon="grid" />
        <span>Table</span>
      </button>

      <button
        type="button"
        class="drawer-navbar-primary__link"
        :class="{ 'drawer-navbar-primary__link--active': props.isMapPage }"
        @click="emitNavigate('map')"
      >
        <ion-icon :icon="globe" />
        <span>Map</span>
      </button>

      <a class="drawer-navbar-primary__link" :href="props.projectHomeUrl">
        <ion-icon :icon="power" />
        <span>Exit</span>
      </a>
    </nav>
  </section>
</template>

<script>
import { IonIcon } from '@ionic/vue';
import { cloudDownload, globe, grid, logIn, logOut, power } from 'ionicons/icons';

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
      }
    };

    return {
      props,
      ...methods,
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
<style src="@/theme/app/DrawerNavbarPrimary.scss" lang="scss"></style>
