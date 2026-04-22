<template>
  <div class="entries-grid-shell">
    <div v-if="isLoading" class="entries-grid__loading">
      <LoaderSpinner />
    </div>

    <AgGridVue
      class="ag-theme-quartz entries-grid"
      theme="legacy"
      :column-defs="columnDefs"
      :default-col-def="state.defaultColDef"
      :row-data="rowData"
      :animate-rows="true"
      :class="{ 'entries-grid--hidden': isLoading }"
      :suppress-drag-leave-hides-columns="true"
      :ensure-dom-order="true"
      :suppress-cell-focus="true"
      :row-height="50"
    />
  </div>
</template>

<script>
import { computed, reactive } from 'vue';
import LoaderSpinner from '@/components/global/LoaderSpinner.vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { mapTableRowsToGrid } from '@/core/entries/ag-grid/columnDefs';
import { createEntriesColumnDefs } from '@/services/entries/entriesGridColumns';

ModuleRegistry.registerModules([AllCommunityModule]);

export default {
  name: 'GridEntries',
  components: {
    AgGridVue,
    LoaderSpinner
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
    const state = reactive({
      defaultColDef: {
        sortable: false,
        resizable: false,
        wrapHeaderText: false
      }
    });

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
