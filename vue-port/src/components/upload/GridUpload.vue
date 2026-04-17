<template>
  <div class="upload-grid-shell">
    <AgGridVue
      class="ag-theme-quartz upload-grid"
      theme="legacy"
      :column-defs="columnDefs"
      :default-col-def="defaultColDef"
      :row-data="rows"
      :get-row-height="getRowHeight"
      :get-row-class="getRowClass"
      :suppress-row-transform="true"
      :ensure-dom-order="true"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { createUploadColumnDefs } from '@/components/upload/ag-grid/uploadColumnDefs';

ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps({
  headers: {
    type: Array,
    default: () => []
  },
  rows: {
    type: Array,
    default: () => []
  }
});

const columnDefs = computed(() => createUploadColumnDefs(props.headers));

const defaultColDef = {
  resizable: true,
  wrapHeaderText: true
};

const getRowHeight = (params) => {
  return params.data?.rowType === 'error' ? 34 : 44;
};

const getRowClass = (params) => {
  return params.data?.rowType === 'error' ? 'upload-grid__row--error' : '';
};
</script>
