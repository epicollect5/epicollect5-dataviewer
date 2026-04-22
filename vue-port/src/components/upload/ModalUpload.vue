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
          <select :value="state.uploadStore.activeMappingIndex" @change="handleMappingChange($event.target.value)">
            <option v-for="(mapping, index) in state.projectStore.projectMapping" :key="mapping.name" :value="index">
              {{ mapping.name }}
            </option>
          </select>
        </label>

        <label class="upload-modal__field upload-modal__field--search">
          <span>CSV file</span>
          <input type="file" accept=".csv,text/csv" @change="handleFileChange" />
        </label>

        <div class="upload-modal__actions">
          <ion-button :disabled="!state.selectedFile || state.uploadStore.isPreparing" @click="prepareUpload">
            Prepare
          </ion-button>
          <ion-button
            color="secondary"
            :disabled="state.uploadStore.reverseEntries.length === 0 || state.uploadStore.isUploading"
            @click="startUpload"
          >
            Upload
          </ion-button>
        </div>
      </div>

      <p v-if="state.uploadStore.parsingError" class="upload-modal__error">{{ state.uploadStore.parsingError }}</p>

      <div v-if="state.uploadStore.reverseEntries.length > 0" class="upload-modal__status">
        <label>
          <input
            type="checkbox"
            :checked="state.uploadStore.filterByFailed"
            :disabled="state.uploadStore.failedReverseEntries.length === 0"
            @change="handleFailedFilterChange($event.target.checked)"
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
            :disabled="failedRowsForDownload.length === 0"
            @click="downloadFailedRows"
          >
            Download failed rows
          </ion-button>
        </div>
      </div>

      <UploadGrid
        v-if="pagedRows.length > 0"
        :headers="state.uploadStore.availableHeaders"
        :rows="pagedRows"
      />

      <div v-if="totalPages > 1" class="upload-modal__pagination">
        <span>Page {{ state.currentPage }} / {{ totalPages }}</span>
        <div class="upload-modal__actions">
          <ion-button fill="outline" :disabled="state.currentPage === 1" @click="goToPreviousPage">Prev</ion-button>
          <ion-button fill="outline" :disabled="state.currentPage === totalPages" @click="goToNextPage">Next</ion-button>
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
import UploadGrid from '@/components/upload/GridUpload.vue';
import { useModalStore } from '@/stores/modalStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { useToastStore } from '@/stores/toastStore';
import { useUploadStore } from '@/stores/uploadStore';

const pageSize = 25;

export default {
  name: 'ModalUpload',
  components: {
    IonButton,
    IonButtons,
    IonContent,
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
      goToPreviousPage() {
        if (state.currentPage > 1) {
          state.currentPage -= 1;
        }
      },
      goToNextPage() {
        if (state.currentPage < computedState.totalPages.value) {
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
        if (computedState.failedRowsForDownload.value.length === 0) {
          return;
        }

        const data = Papa.unparse(computedState.failedRowsForDownload.value);
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
        toastStore.show(`Downloaded ${computedState.failedRowsForDownload.value.length} failed row(s).`, {
          color: 'medium'
        });
      }
    };

    const computedState = {
      totalPages: computed(() => {
        return Math.max(1, Math.ceil(uploadStore.pairedRows.length / pageSize));
      }),
      pagedRows: computed(() => {
        const start = (state.currentPage - 1) * pageSize;
        return uploadStore.pairedRows.slice(start, start + pageSize);
      }),
      failedRowsForDownload: computed(() => {
        return uploadStore.uploadResults.reduce((rows, result, index) => {
          if (result.status !== 'error') {
            return rows;
          }

          const currentRow = { ...uploadStore.uploadedRows[index] };
          Object.keys(currentRow).forEach((key) => {
            if (!uploadStore.bulkUploadableHeaders.includes(key)) {
              delete currentRow[key];
            }
          });
          rows.push(currentRow);
          return rows;
        }, []);
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
      ...computedState
    };
  }
};
</script>
<style src="@/theme/upload/ModalUpload.scss" lang="scss"></style>
