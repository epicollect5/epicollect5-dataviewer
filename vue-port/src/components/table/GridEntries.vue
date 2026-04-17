<template>
  <div class="entries-grid-shell">
    <AgGridVue
      class="ag-theme-quartz entries-grid"
      theme="legacy"
      :column-defs="columnDefs"
      :default-col-def="defaultColDef"
      :row-data="rowData"
      :animate-rows="true"
      :suppress-drag-leave-hides-columns="true"
      :ensure-dom-order="true"
      :suppress-row-click-selection="true"
      :suppress-cell-focus="true"
      :row-height="50"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { createEntriesColumnDefs, mapTableRowsToGrid } from '@/components/table/ag-grid/columnDefs';

ModuleRegistry.registerModules([AllCommunityModule]);

const props = defineProps({
  headers: {
    type: Array,
    default: () => []
  },
  rows: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const columnDefs = computed(() => createEntriesColumnDefs(props.headers));
const rowData = computed(() => mapTableRowsToGrid(props.rows));
const defaultColDef = {
  sortable: false,
  resizable: false,
  wrapHeaderText: true
};
</script>
