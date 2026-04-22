import { createPinia, setActivePinia } from 'pinia';
import PARAMETERS from '@/core/config/parameters';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

describe('stores/tableStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('builds entries request params from navigation and filters state', () => {
    const filtersStore = useFiltersStore();
    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    navigationStore.setCurrentForm('form_1', 'Form One');
    filtersStore.setTitle('abc');
    filtersStore.setDates('2024-01-01T00:00:00.000Z', '2024-01-31T00:00:00.000Z');
    filtersStore.setOrder(PARAMETERS.ORDER_BY.AZ, 'title', 'ASC');

    expect(tableStore.buildEntriesParams({ page: 3 })).toEqual({
      form_ref: 'form_1',
      title: 'abc',
      filter_from: '2024-01-01T00:00:00.000Z',
      filter_to: '2024-01-31T00:00:00.000Z',
      filter_by: 'created_at',
      sort_by: 'title',
      sort_order: 'ASC',
      page: 3
    });
  });
});
