<!--suppress ALL -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ projectName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div v-if="isLoading">
        Loading...
      </div>

      <div v-else>
        <p>Total entries: {{ totalEntries }}</p>

        <ion-button @click="loadEntries">
          Reload Entries
        </ion-button>

        <ion-list v-if="entries.length > 0">
          <ion-item
            v-for="entry in entries"
            :key="entry.id">
            {{ entry.title }}
          </ion-item>
        </ion-list>

        <p v-else>
          No entries found.
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { reactive, toRefs } from 'vue';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import entryService from '@/services/entry-service';

export default {
  name: 'ExampleComponent',
  emits: ['load-entries'],
  components: {
    IonButton,
    IonContent,
    IonHeader,
    IonItem,
    IonList,
    IonPage,
    IonTitle,
    IonToolbar
  },
  setup() {
    const state = reactive({
      projectName: 'Example Project',
      entries: [],
      isLoading: false
    });

    const methods = {
      async loadEntries() {
        state.isLoading = true;

        try {
          state.entries = await entryService.getEntries();
        } catch (error) {
          console.error(error);
          state.entries = [];
        } finally {
          state.isLoading = false;
        }
      }
    };

    const computed = {
      totalEntries() {
        return state.entries.length;
      }
    };

    return {
      state,
      ...methods,
      ...computed
    };
  }
};
</script>
<style src="@/theme/ExampleComponent.scss" lang="scss"></style>

