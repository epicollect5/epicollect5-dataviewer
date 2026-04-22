<template>
  <div class="upload-grid-shell">
    <AgGridVue
      class="ag-theme-quartz upload-grid"
      theme="legacy"
      :column-defs="columnDefs"
      :default-col-def="state.defaultColDef"
      :row-data="rows"
      :get-row-height="getRowHeight"
      :get-row-class="getRowClass"
      :suppress-row-transform="true"
      :ensure-dom-order="true"
    />
  </div>
</template>

<script>
import { computed } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { createUploadColumnDefs } from '@/components/upload/ag-grid/uploadColumnDefs';

ModuleRegistry.registerModules([AllCommunityModule]);

export default {
  name: 'GridUpload',
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
    }
  },
  setup(props) {
    const state = {
      defaultColDef: {
        resizable: true,
        wrapHeaderText: true
      }
    };

    const methods = {
      getRowHeight(params) {
        return params.data?.rowType === 'error' ? 34 : 44;
      },
      getRowClass(params) {
        return params.data?.rowType === 'error' ? 'upload-grid__row--error' : '';
      }
    };

    const computedState = {
      columnDefs: computed(() => createUploadColumnDefs(props.headers))
    };

    return {
      state,
      ...methods,
      ...computedState
    };
  }
};
</script>
