import { createPinia, setActivePinia } from 'pinia';
import PARAMETERS from '@/core/config/parameters';
import { fetchEntries } from '@/services/api/entriesApi';
import { useFiltersStore } from '@/stores/filtersStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';

vi.mock('@/services/api/entriesApi', () => ({
  fetchEntries: vi.fn()
}));

describe('stores/tableStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('keeps the table loader up for the minimum page delay', async () => {
    vi.useFakeTimers();

    const navigationStore = useNavigationStore();
    const projectStore = useProjectStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo-project';
    projectStore.projectExtra = {
      forms: { form_1: { inputs: [], group: {} } },
      inputs: {}
    };
    projectStore.projectDefinition = {
      project: { forms: [{ ref: 'form_1', inputs: [] }] }
    };
    navigationStore.setCurrentForm('form_1', 'Form One');
    fetchEntries.mockResolvedValue({
      data: {
        data: [],
        meta: { total: 0, current_page: 1, last_page: 1 },
        links: { self: 'https://five.epicollect.net/api/entries/demo?page=1' }
      }
    });

    expect(PARAMETERS.DELAY.TABLE_PAGE_MIN).toBe(2000);

    const loadPromise = tableStore.loadEntries({ params: { page: 1 } });

    await vi.advanceTimersByTimeAsync(0);

    expect(tableStore.isFetchingPage).toBe(true);
    expect(tableStore.hasLoadedInitialPage).toBe(false);

    await vi.advanceTimersByTimeAsync(PARAMETERS.DELAY.TABLE_PAGE_MIN - 1);

    expect(tableStore.hasLoadedInitialPage).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await loadPromise;

    expect(tableStore.hasLoadedInitialPage).toBe(true);
    expect(tableStore.isFetchingPage).toBe(false);
  });
});
