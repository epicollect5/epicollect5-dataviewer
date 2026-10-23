<template>
  <div class="drawer-upload">
    <ion-card class="drawer-upload__card">
      <ion-card-header class="drawer-upload__card-header" color="light">
        <ion-card-title>Mapping</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-upload__card-content ion-margin-top">
        <Dropdown
          :model-value="state.uploadStore.activeMappingIndex"
          :options="mappingOptions"
          @change="handleMappingChange"
        />
      </ion-card-content>
    </ion-card>

    <ion-card class="drawer-upload__card">
      <ion-card-header class="drawer-upload__card-header" color="light">
        <ion-card-title>File <code>(.csv)</code></ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-upload__card-content drawer-upload__file ion-margin-top">
        <input
          :ref="setFileInput"
          type="file"
          accept=".csv,text/csv"
          class="drawer-upload__file-input"
          @change="handleFileChange"
        />
        <button
          type="button"
          class="drawer-upload__action"
          :disabled="isChooseDisabled"
          @click="openFilePicker"
        >
          <ion-icon :icon="folderOpen" />
          <span>Choose</span>
        </button>
        <p v-if="state.selectedFileName" class="drawer-upload__filename">{{ state.selectedFileName }}</p>
      </ion-card-content>
    </ion-card>

    <ion-card class="drawer-upload__card">
      <ion-card-header class="drawer-upload__card-header" color="light">
        <ion-card-title>Current View Template</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-upload__card-content drawer-upload__file ion-margin-top">
        <button type="button" class="drawer-upload__action" @click="downloadTemplate">
          <ion-icon :icon="download" />
          <span>Download</span>
        </button>
      </ion-card-content>
    </ion-card>

    <ion-card class="drawer-upload__card">
      <ion-card-header class="drawer-upload__card-header" color="light">
        <ion-card-title>Current View Subset</ion-card-title>
      </ion-card-header>
      <ion-card-content class="drawer-upload__card-content drawer-upload__file ion-margin-top">
        <button type="button" class="drawer-upload__action" @click="downloadSubset">
          <ion-icon :icon="download" />
          <span>Download</span>
        </button>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script>
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon
} from '@ionic/vue';
import { download, folderOpen } from 'ionicons/icons';
import { computed, onUnmounted, reactive } from 'vue';
import Dropdown from '@/components/global/Dropdown.vue';
import PARAMETERS from '@/core/config/parameters';
import { startDownload } from '@/services/download/downloadWorkflow';
import { useFiltersStore } from '@/stores/filtersStore';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';
import { useUploadStore } from '@/stores/uploadStore';
import helpers from '@/utils/helpers';

export default {
  name: 'DrawerUpload',
  components: {
    Dropdown,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon
  },
  setup() {
    const filtersStore = useFiltersStore();
    const modalStore = useModalStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();
    const uploadStore = useUploadStore();
    let cancelDownload = null;

    const state = reactive({
      modalStore,
      navigationStore,
      projectStore,
      filtersStore,
      tableStore,
      toastStore,
      uploadStore,
      fileInput: null,
      selectedFileName: ''
    });

    const methods = {
      setFileInput(element) {
        state.fileInput = element;
      },
      openFilePicker() {
        state.fileInput?.click();
      },
      async handleFileChange(event) {
        const file = event.target.files?.[0] || null;
        //allow choosing the same file again
        event.target.value = '';

        if (!file) {
          return;
        }

        state.selectedFileName = file.name;

        if (file.size > PARAMETERS.BULK_MAX_FILE_SIZE_BYTES) {
          toastStore.show(PARAMETERS.LABELS.FILE_SIZE_ERROR, {
            color: 'danger',
            duration: 2500
          });
          return;
        }

        await methods.prepareAndUpload(file);
      },
      async prepareAndUpload(file) {
        navigationStore.setBusy(true);

        try {
          uploadStore.reset();

          const wasPrepared = await uploadStore.prepareFile(file);

          if (!wasPrepared) {
            if (uploadStore.parsingError) {
              toastStore.show(uploadStore.parsingError, {
                color: 'danger',
                duration: 2500
              });
            }
            return;
          }

          modalStore.open('upload');
          void uploadStore.uploadPreparedEntries();
        } finally {
          navigationStore.setBusy(false);
        }
      },
      handleMappingChange(index) {
        uploadStore.setActiveMapping(Number(index));
      },
      getCurrentForm() {
        return projectStore.forms.find((form) => form.ref === navigationStore.currentFormRef) || null;
      },
      getProjectSlug() {
        return projectStore.projectSlug || projectStore.projectDefinition.project?.slug || '';
      },
      getRequestTimestamp() {
        return new Date().getTime().toString();
      },
      startPreparedDownload(endpoint, requestTimestamp) {
        if (cancelDownload) {
          cancelDownload();
        }

        modalStore.open('prepare-download');
        cancelDownload = startDownload({
          endpoint,
          requestTimestamp,
          onSettled: () => {
            modalStore.close();
            cancelDownload = null;
          }
        });
      },
      downloadTemplate() {
        const form = methods.getCurrentForm();
        const projectSlug = methods.getProjectSlug();

        if (!form || !projectSlug) {
          return;
        }

        const requestTimestamp = methods.getRequestTimestamp();
        const mapName = uploadStore.activeMapping?.name || '';
        const filename = `${projectSlug}__${form.name}__${mapName}__upload-template`;
        const formIndex = helpers.getFormIndexFromRef(projectStore.projectDefinition.project.forms, form.ref);
        const endpoint = helpers.getUploadTemplateEndpoint({
          projectSlug,
          mapIndex: uploadStore.activeMapping?.map_index,
          formIndex,
          currentBranchRef: navigationStore.currentBranchRef,
          format: PARAMETERS.FORMAT_CSV,
          requestTimestamp,
          filename
        });

        methods.startPreparedDownload(endpoint, requestTimestamp);
      },
      downloadSubset() {
        const form = methods.getCurrentForm();
        const projectSlug = methods.getProjectSlug();

        if (!form || !projectSlug) {
          return;
        }

        const requestTimestamp = methods.getRequestTimestamp();
        const mapName = uploadStore.activeMapping?.name || '';
        const filename = `${projectSlug}__${form.name}__${mapName}__subset.zip`;
        const endpoint = helpers.getDownloadSubsetEndpoint({
          projectSlug,
          hierarchyNavigator: computedScope.hierarchyNavigatorForDownload.value,
          filterByTitle: filtersStore.filterByTitle,
          filterStartDate: filtersStore.startDate,
          filterEndDate: filtersStore.endDate,
          filterSortOrder: filtersStore.sortOrder,
          requestTimestamp,
          filename,
          currentBranchRef: navigationStore.currentBranchRef,
          currentBranchOwnerUuid: null
        });

        methods.startPreparedDownload(endpoint, requestTimestamp);
      }
    };

    const computedScope = {
      normalizedMappings: computed(() => {
        return Array.isArray(projectStore.projectMapping)
          ? projectStore.projectMapping
          : Object.values(projectStore.projectMapping || {});
      }),
      mappingOptions: computed(() => {
        return computedScope.normalizedMappings.value.map((mapping, index) => ({
          label: mapping.name,
          value: index
        }));
      }),
      hierarchyNavigatorForDownload: computed(() => {
        const navigator = navigationStore.hierarchyNavigator;
        const lastIndex = navigator.length - 1;
        const currentNavigator = navigator[lastIndex] || {};
        const fallbackSelfLink = `${PARAMETERS.SERVER_URL}${PARAMETERS.API_ENTRIES_ENDPOINT}${methods.getProjectSlug()}?form_ref=${navigationStore.currentFormRef}`;
        const selfLink = tableStore.links?.self || currentNavigator.selfLink || fallbackSelfLink;

        return navigator.map((item, index) => {
          if (index !== lastIndex) {
            return item;
          }

          return {
            ...item,
            selfLink
          };
        });
      }),
      isChooseDisabled: computed(() => uploadStore.isPreparing || uploadStore.isUploading)
    };

    onUnmounted(() => {
      if (cancelDownload) {
        cancelDownload();
      }
    });

    const icons = {
      download,
      folderOpen
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
<style src="@/theme/upload/DrawerUpload.scss" lang="scss"></style>
