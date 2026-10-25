<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Delete entry</ion-title>
      <ion-buttons slot="end">
        <ion-button shape="round" class="photo-lightbox__close-button" aria-label="Close delete dialog" @click="closeModal">
          <ion-icon slot="icon-only" :icon="close" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-card class="delete-entry-modal">
      <ion-card-content>
        <div v-if="isDeleting" class="delete-entry-modal__loader">
          <LoaderSpinner />
        </div>

        <template v-else>
          <p class="delete-entry-modal__message">
            Are you sure you want to delete entry with the title
            <br />
            "{{ entryTitle }}"?
          </p>
          <p class="delete-entry-modal__warning">This action cannot be undone.</p>

          <div class="delete-entry-modal__actions">
            <ion-button fill="outline" color="medium" @click="closeModal">Dismiss</ion-button>
            <ion-button color="danger" :disabled="!canDelete" @click="confirmDelete">Confirm</ion-button>
          </div>
        </template>
      </ion-card-content>
    </ion-card>
  </ion-content>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import { close } from 'ionicons/icons';
import { computed, reactive } from 'vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { canEditEntryForProjectUser } from '@/services/entries/dataEditorFlow';
import { useDrawerStore } from '@/stores/drawerStore';
import { useModalStore } from '@/stores/modalStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';

export default {
  name: 'ModalDeleteEntry',
  components: {
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    LoaderSpinner
  },
  setup() {
    const modalStore = useModalStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();
    const drawerStore = useDrawerStore();

    const state = reactive({
      modalStore,
      isDeleting: false
    });

    const methods = {
      closeModal() {
        modalStore.close();
      },
      async confirmDelete() {
        //the cell is already gated, but the modal must not delete an entry the
        //project user is not allowed to touch
        if (!computedScope.canDelete.value) {
          toastStore.show('You do not have permission to delete this entry.', {
            color: 'danger',
            duration: 2600
          });
          modalStore.close();

          return;
        }

        state.isDeleting = true;

        try {
          await tableStore.deleteCurrentEntry(computedScope.payload.value);
          toastStore.show(`Deleted "${computedScope.entryTitle.value}".`, {
            color: 'success'
          });
          //the map entry drawer would otherwise keep showing the deleted entry
          if (drawerStore.activeDrawer === 'map-entry') {
            drawerStore.close();
          }
          modalStore.close();
        } catch (error) {
          toastStore.show(error.message || 'Delete failed.', {
            color: 'danger',
            duration: 2600
          });
        } finally {
          state.isDeleting = false;
        }
      }
    };

    const computedScope = {
      isDeleting: computed(() => state.isDeleting),
      payload: computed(() => modalStore.payload || {}),
      entryTitle: computed(() => computedScope.payload.value.entryTitle || 'Untitled entry'),
      canDelete: computed(() => {
        return canEditEntryForProjectUser({
          relationships: computedScope.payload.value.entryExtra?.relationships
        });
      })
    };

    const icons = {
      close
    };

    return {
      state,
      ...methods,
      ...computedScope,
      ...icons
    };
  }
};
</script>
<style src="@/theme/entry/ModalDeleteEntry.scss" lang="scss"></style>
