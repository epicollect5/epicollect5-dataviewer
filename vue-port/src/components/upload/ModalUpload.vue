<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Bulk Upload</ion-title>
      <ion-buttons slot="end">
        <ion-button :disabled="state.uploadStore.isUploading" @click="handleClose">Close</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <section class="upload-modal">
      <div class="upload-modal__controls">
        <label class="upload-modal__field">
          <span>Mapping</span>
          <Dropdown
            :model-value="state.uploadStore.activeMappingIndex"
            :options="mappingOptions"
            @change="handleMappingChange"
          />
        </label>

        <label class="upload-modal__field upload-modal__field--search">
          <span>CSV file</span>
          <input type="file" accept=".csv,text/csv" @change="handleFileChange" />
        </label>

        <div class="upload-modal__actions">
          <ion-button :disabled="isPrepareDisabled" @click="prepareUpload">
            Prepare
          </ion-button>
          <ion-button
            color="secondary"
            :disabled="isUploadDisabled"
            @click="startUpload"
          >
            Upload
          </ion-button>
        </div>
      </div>

      <p v-if="state.uploadStore.parsingError" class="upload-modal__error">{{ state.uploadStore.parsingError }}</p>

      <div v-if="hasPreparedRows" class="upload-modal__status">
        <label>
          <input
            type="checkbox"
            :checked="state.uploadStore.filterByFailed"
            :disabled="isFailedFilterDisabled"
            @change="handleFailedFilterToggle"
          />
          Show only failed rows
        </label>
        <span>
          Uploaded {{ state.uploadStore.uploadResults.length }} / {{ state.uploadStore.reverseEntries.length }}
          <template v-if="state.uploadStore.isUploading"> · {{ state.uploadStore.uploadProgress }}%</template>
        </span>
        <div class="upload-modal__actions">
          <ion-button
            fill="outline"
            :disabled="isFailedDownloadDisabled"
            @click="downloadFailedRows"
          >
            Download failed rows
          </ion-button>
        </div>
      </div>

      <UploadGrid
        v-if="hasPagedRows"
        :headers="state.uploadStore.availableHeaders"
        :rows="pagedRows"
      />

      <div v-if="hasPagination" class="upload-modal__pagination">
        <span>Page {{ state.currentPage }} / {{ totalPages }}</span>
        <div class="upload-modal__actions">
          <ion-button fill="outline" :disabled="isOnFirstPage" @click="goToPreviousPage">Prev</ion-button>
          <ion-button fill="outline" :disabled="isOnLastPage" @click="goToNextPage">Next</ion-button>
        </div>
      </div>

      <p v-else class="upload-modal__hint">
        Choose a CSV file, prepare it against the current mapping, then upload to inspect row-level validation.
      </p>
    </section>
  </ion-content>
</template>

<script>
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/vue';
import Papa from 'papaparse';
import { computed, reactive, watch } from 'vue';
import Dropdown from '@/components/global/Dropdown.vue';
import UploadGrid from '@/components/upload/GridUpload.vue';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';
import { useUploadStore } from '@/stores/uploadStore';
import { buildFailedRows } from '@/services/upload/uploadWorkflow';

const pageSize = 25;

export default {
  name: 'ModalUpload',
  components: {
    IonButton,
    IonButtons,
    IonContent,
    Dropdown,
    IonHeader,
    IonTitle,
    IonToolbar,
    UploadGrid
  },
  setup() {
    const modalStore = useModalStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();
    const toastStore = useToastStore();
    const uploadStore = useUploadStore();

    const state = reactive({
      modalStore,
      navigationStore,
      projectStore,
      tableStore,
      toastStore,
      uploadStore,
      selectedFile: null,
      currentPage: 1
    });

    const methods = {
      async handleClose() {
        const shouldReload = uploadStore.uploadResults.length > 0 && !uploadStore.isUploading;
        uploadStore.reset();
        modalStore.close();
        if (shouldReload) {
          await tableStore.loadEntries({ params: { page: 1 } });
        }
      },
      handleFileChange(event) {
        state.selectedFile = event.target.files?.[0] || null;
      },
      handleMappingChange(index) {
        uploadStore.setActiveMapping(Number(index));
      },
      handleFailedFilterChange(value) {
        uploadStore.setFilterByFailed(value);
      },
      handleFailedFilterToggle(event) {
        methods.handleFailedFilterChange(event.target.checked);
      },
      goToPreviousPage() {
        if (state.currentPage > 1) {
          state.currentPage -= 1;
        }
      },
      goToNextPage() {
        if (state.currentPage < computedScope.totalPages.value) {
          state.currentPage += 1;
        }
      },
      async prepareUpload() {
        if (!state.selectedFile) {
          return;
        }

        state.currentPage = 1;
        navigationStore.setBusy(true);

        try {
          const wasPrepared = await uploadStore.prepareFile(state.selectedFile);

          if (wasPrepared) {
            toastStore.show(`Prepared ${uploadStore.reverseEntries.length} row(s).`, {
              color: 'success'
            });
          } else if (uploadStore.parsingError) {
            toastStore.show(uploadStore.parsingError, {
              color: 'danger',
              duration: 2500
            });
          }
        } finally {
          navigationStore.setBusy(false);
        }
      },
      async startUpload() {
        state.currentPage = 1;
        navigationStore.setBusy(true);

        try {
          await uploadStore.uploadPreparedEntries();

          const failures = uploadStore.uploadResults.filter((result) => result.status === 'error').length;

          toastStore.show(
            failures > 0
              ? `Upload finished with ${failures} failed row(s).`
              : `Uploaded ${uploadStore.uploadResults.length} row(s).`,
            {
              color: failures > 0 ? 'warning' : 'success',
              duration: 2600
            }
          );
        } finally {
          navigationStore.setBusy(false);
        }
      },
      downloadFailedRows() {
        if (computedScope.failedRowsForDownload.value.length === 0) {
          return;
        }

        const data = Papa.unparse(computedScope.failedRowsForDownload.value);
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const slug = projectStore.projectSlug || 'project';

        link.href = url;
        link.download = `${slug}__failed-rows.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toastStore.show(`Downloaded ${computedScope.failedRowsForDownload.value.length} failed row(s).`, {
          color: 'medium'
        });
      }
    };

    const computedScope = {
      mappingOptions: computed(() => {
        return projectStore.projectMapping.map((mapping, index) => ({
          label: mapping.name,
          value: index
        }));
      }),
      isPrepareDisabled: computed(() => !state.selectedFile || uploadStore.isPreparing),
      isUploadDisabled: computed(() => uploadStore.reverseEntries.length === 0 || uploadStore.isUploading),
      hasPreparedRows: computed(() => uploadStore.reverseEntries.length > 0),
      isFailedFilterDisabled: computed(() => uploadStore.failedReverseEntries.length === 0),
      isFailedDownloadDisabled: computed(() => computedScope.failedRowsForDownload.value.length === 0),
      hasPagedRows: computed(() => computedScope.pagedRows.value.length > 0),
      hasPagination: computed(() => computedScope.totalPages.value > 1),
      isOnFirstPage: computed(() => state.currentPage === 1),
      isOnLastPage: computed(() => state.currentPage === computedScope.totalPages.value),
      totalPages: computed(() => {
        return Math.max(1, Math.ceil(uploadStore.pairedRows.length / pageSize));
      }),
      pagedRows: computed(() => {
        const start = (state.currentPage - 1) * pageSize;
        return uploadStore.pairedRows.slice(start, start + pageSize);
      }),
      failedRowsForDownload: computed(() => {
        return buildFailedRows({
          uploadResults: uploadStore.uploadResults,
          uploadedRows: uploadStore.uploadedRows,
          bulkUploadableHeaders: uploadStore.bulkUploadableHeaders
        });
      })
    };

    watch(
      () => [uploadStore.filterByFailed, uploadStore.pairedRows.length],
      () => {
        state.currentPage = 1;
      }
    );

    return {
      state,
      ...methods,
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/upload/ModalUpload.scss" lang="scss"></style>
