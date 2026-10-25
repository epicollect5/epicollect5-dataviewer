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
      :class="gridClasses"
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
    childFormName: {
      type: String,
      default: 'Children'
    },
    hasChildForm: {
      type: Boolean,
      default: false
    },
    canAddEntry: {
      type: Boolean,
      default: false
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

    const computedScope = {
      columnDefs: computed(() => createEntriesColumnDefs(props.headers, {
        childFormName: props.childFormName,
        hasChildForm: props.hasChildForm,
        canAddEntry: props.canAddEntry
      })),
      rowData: computed(() => props.rows),
      gridClasses: computed(() => ({
        'entries-grid--hidden': props.isLoading
      }))
    };

    return {
      state,
      ...computedScope
    };
  }
};
</script>
<style src="@/theme/table/GridEntries.scss" lang="scss"></style>
