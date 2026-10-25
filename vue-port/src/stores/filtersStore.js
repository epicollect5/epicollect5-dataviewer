import { defineStore } from 'pinia';
import PARAMETERS from '@/core/config/parameters';

export const useFiltersStore = defineStore('filters', {
  state: () => ({
    filterByTitle: '',
    startDate: '',
    endDate: '',
    selectedOrderBy: PARAMETERS.ORDER_BY ? PARAMETERS.ORDER_BY.NEWEST : 'Newest',
    sortBy: PARAMETERS.DEFAULT_ORDERING_COLUMN,
    sortOrder: PARAMETERS.DEFAULT_ORDERING
  }),
  actions: {
    setTitle(title) {
      this.filterByTitle = title;
    },
    setDates(startDate, endDate) {
      this.startDate = startDate || '';
      this.endDate = endDate || '';
    },
    setOrder(selectedOrderBy, sortBy, sortOrder) {
      this.selectedOrderBy = selectedOrderBy;
      this.sortBy = sortBy;
      this.sortOrder = sortOrder;
    },
    //back from the data editor: the restored entries page was fetched with these filters
    restore(entriesFilters) {
      if (!entriesFilters) {
        return;
      }

      this.filterByTitle = entriesFilters.filterByTitle || '';
      this.startDate = entriesFilters.startDate || '';
      this.endDate = entriesFilters.endDate || '';
      this.selectedOrderBy = entriesFilters.selectedOrderBy || PARAMETERS.ORDER_BY.NEWEST;
      this.sortBy = entriesFilters.sortBy || PARAMETERS.DEFAULT_ORDERING_COLUMN;
      this.sortOrder = entriesFilters.sortOrder || PARAMETERS.DEFAULT_ORDERING;
    },
    reset() {
      this.filterByTitle = '';
      this.startDate = '';
      this.endDate = '';
      this.selectedOrderBy = PARAMETERS.ORDER_BY ? PARAMETERS.ORDER_BY.NEWEST : 'Newest';
      this.sortBy = PARAMETERS.DEFAULT_ORDERING_COLUMN;
      this.sortOrder = PARAMETERS.DEFAULT_ORDERING;
    }
  }
});
