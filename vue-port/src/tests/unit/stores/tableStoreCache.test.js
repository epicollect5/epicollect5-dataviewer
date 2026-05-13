import { createPinia, setActivePinia } from 'pinia';
import client from '@/services/api/client';
import { clearEntriesPageCache } from '@/services/entries/entriesPageCache';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTableStore } from '@/stores/tableStore';
import { fetchEntries } from '@/services/api/entriesApi';

vi.mock('@/services/api/entriesApi', () => ({
  fetchEntries: vi.fn()
}));

vi.mock('@/core/entries/tableModel', () => ({
  default: {
    getHeaders: vi.fn(() => []),
    getRows: vi.fn(() => [
      [
        { entryUuid: 'entry-1' },
        {},
        {},
        { answer: 0 },
        { answer: 'Cached entry' },
        { answer: '15th Jan, 2024' }
      ]
    ])
  }
}));

describe('stores/tableStore page cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    clearEntriesPageCache();
    fetchEntries.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    clearEntriesPageCache();
  });

  it('reuses cached entry pages for the same project and request url', async () => {
    const projectStore = useProjectStore();
    const navigationStore = useNavigationStore();
    const tableStore = useTableStore();

    projectStore.projectSlug = 'demo';
    projectStore.projectDefinition = {
      project: {
        ref: 'project_ref_1'
      }
    };
    navigationStore.setCurrentForm('form_1', 'Form 1');

    const pageOneUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=1';
    const pageTwoUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=2';
    const clientGetSpy = vi.spyOn(client, 'get').mockResolvedValue({
      data: {
        data: [],
        meta: {
          total: 1,
          current_page: 2,
          last_page: 2
        },
        links: {
          self: pageTwoUrl,
          prev: pageOneUrl,
          next: null
        }
      }
    });

    fetchEntries.mockResolvedValue({
      data: {
        data: [],
        meta: {
          total: 1,
          current_page: 1,
          last_page: 2
        },
        links: {
          self: pageOneUrl,
          prev: null,
          next: pageTwoUrl
        }
      }
    });

    await tableStore.loadEntries({ params: { page: 1 } });
    await tableStore.loadEntries({ pageUrl: pageTwoUrl });
    await tableStore.loadEntries({ pageUrl: pageOneUrl });
    await tableStore.loadEntries({ pageUrl: pageTwoUrl });

    expect(fetchEntries).toHaveBeenCalledTimes(1);
    expect(clientGetSpy).toHaveBeenCalledTimes(2);
    expect(tableStore.isFetchingPage).toBe(false);
    expect(tableStore.rowCount).toBe(1);
    expect(tableStore.gridRows[0]).toEqual(expect.objectContaining({
      id: 'entry-1',
      title: 'Cached entry'
    }));
  });
});
