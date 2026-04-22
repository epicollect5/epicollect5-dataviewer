<template>
  <div class="entries-grid-shell">
    <AgGridVue
      class="ag-theme-quartz entries-grid"
      theme="legacy"
      :column-defs="columnDefs"
      :default-col-def="state.defaultColDef"
      :row-data="rowData"
      :animate-rows="true"
      :suppress-drag-leave-hides-columns="true"
      :ensure-dom-order="true"
      :suppress-cell-focus="true"
      :row-height="50"
    />
  </div>
</template>

<script>
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { createEntriesColumnDefs, mapTableRowsToGrid } from '@/components/table/ag-grid/columnDefs';

ModuleRegistry.registerModules([AllCommunityModule]);

export default {
  name: 'GridEntries',
  components: {
    AgGridVue
  },
  props: {
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
  },
  setup(props) {
    const state = {
      defaultColDef: {
        sortable: false,
        resizable: false,
        wrapHeaderText: false
      }
    };

    const computedState = {
      columnDefs: computed(() => createEntriesColumnDefs(props.headers)),
      rowData: computed(() => mapTableRowsToGrid(props.rows))
    };

    return {
      state,
      ...computedState
    };
  }
};
</script>
<style src="@/theme/table/GridEntries.scss" lang="scss"></style>
