import { defineStore } from 'pinia';
import PARAMETERS from '@/config/parameters';

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
