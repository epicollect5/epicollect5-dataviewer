import lscache from 'lscache';
import {
  clearEntriesApiCache,
  clearEntriesLocationsCache,
  clearEntriesPageCache,
  compress,
  decompress,
  getCachedEntriesLocations,
  getCachedEntriesPage,
  getEntriesLocationsCacheKey,
  getEntriesLocationsRequestUrl,
  getEntriesPageCacheKey,
  getPayloadSelfUrl,
  getProjectCacheRef,
  hashUrl,
  normalizeUrlForCache,
  setCachedEntriesLocations,
  setCachedEntriesPage
} from '@/services/entries/entriesPageCache';

describe('services/entries/entriesPageCache', () => {
  beforeEach(() => {
    clearEntriesApiCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearEntriesApiCache();
  });

  it('keys pages by project ref and SHA-256 request url', async () => {
    const requestUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=2';
    const hashedUrl = await hashUrl(requestUrl);

    expect(hashedUrl).toBe('1aabc224b37884c942d55976da6523f9758bee946b05bc876e151997ec02e8f8');
    expect(await getEntriesPageCacheKey({ projectRef: 'project_1', requestUrl })).toBe(`project_1:${hashedUrl}`);
  });

  it('round-trips cached payload text through gzip compression streams', async () => {
    const text = JSON.stringify({
      data: Array.from({ length: 10 }, (_, index) => ({
        id: `entry-${index}`,
        title: 'Repeated entry title for compression'
      }))
    });
    const compressed = await compress(text);

    expect(compressed).toBeInstanceOf(Uint8Array);
    expect(await decompress(compressed)).toBe(text);
  });

  it('normalizes request URLs before hashing cache keys', async () => {
    const leftUrl = 'http://localhost/api/internal/entries-locations/demo?page=2&form_ref=form_1&input_ref=location_1';
    const rightUrl = 'http://localhost/api/internal/entries-locations/demo?input_ref=location_1&page=2&form_ref=form_1';

    expect(normalizeUrlForCache(leftUrl)).toBe(normalizeUrlForCache(rightUrl));
    expect(await getEntriesLocationsCacheKey({ projectRef: 'project_1', requestUrl: leftUrl })).toBe(
      await getEntriesLocationsCacheKey({ projectRef: 'project_1', requestUrl: rightUrl })
    );
  });

  it('reads canonical self URLs from Laravel link payloads', () => {
    expect(getPayloadSelfUrl({
      links: {
        self: 'https://example.com/links-self'
      }
    })).toBe('https://example.com/links-self');

    expect(getPayloadSelfUrl({
      link: {
        self: 'https://example.com/link-self'
      }
    })).toBe('https://example.com/link-self');
  });

  it('keeps cached pages separated by project ref', async () => {
    const requestUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=2';
    const payload = {
      data: [{ id: 'entry-1' }],
      links: {}
    };

    await setCachedEntriesPage({ projectRef: 'project_1', requestUrl, payload });

    expect(await getCachedEntriesPage({ projectRef: 'project_1', requestUrl })).toEqual(payload);
    expect(await getCachedEntriesPage({ projectRef: 'project_2', requestUrl })).toBeNull();
  });

  it('clears cached table pages on demand', async () => {
    const requestUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=2';

    await setCachedEntriesPage({
      projectRef: 'project_1',
      requestUrl,
      payload: { data: [], links: {} }
    });

    clearEntriesPageCache();

    expect(await getCachedEntriesPage({ projectRef: 'project_1', requestUrl })).toBeNull();
  });

  it('keeps cached locations separated from cached table pages', async () => {
    const requestUrl = getEntriesLocationsRequestUrl({
      projectSlug: 'demo',
      params: {
        form_ref: 'form_1',
        input_ref: 'location_1'
      }
    });
    const payload = {
      data: {
        geojson: {
          features: [{ properties: { uuid: 'entry-1' } }]
        }
      }
    };

    await setCachedEntriesLocations({ projectRef: 'project_1', requestUrl, payload });

    expect(await getCachedEntriesLocations({ projectRef: 'project_1', requestUrl })).toEqual(payload);
    expect(await getCachedEntriesPage({ projectRef: 'project_1', requestUrl })).toBeNull();
    expect(await getEntriesLocationsCacheKey({ projectRef: 'project_1', requestUrl })).toBe(
      await getEntriesPageCacheKey({ projectRef: 'project_1', requestUrl })
    );

    clearEntriesLocationsCache();

    expect(await getCachedEntriesLocations({ projectRef: 'project_1', requestUrl })).toBeNull();
  });

  it('returns locations from memory when localStorage misses after storing', async () => {
    const requestUrl = 'http://localhost/~mmenegazzo/epicollect5-server/public/api/internal/entries-locations/ec5-demo-project?form_ref=form_1&input_ref=location_1&per_page=25000&page=2';
    const payload = {
      data: {
        geojson: {
          features: [{ properties: { uuid: 'entry-2' } }]
        }
      }
    };

    vi.spyOn(lscache, 'get').mockReturnValue(null);

    await setCachedEntriesLocations({ projectRef: 'project_1', requestUrl, payload });

    expect(await getCachedEntriesLocations({ projectRef: 'project_1', requestUrl })).toEqual(payload);
  });

  it('clears all entries API caches on demand', async () => {
    const tableUrl = 'https://five.epicollect.net/api/export/entries/demo?form_ref=form_1&page=2';
    const locationsUrl = getEntriesLocationsRequestUrl({
      projectSlug: 'demo',
      params: {
        form_ref: 'form_1',
        input_ref: 'location_1'
      }
    });

    await setCachedEntriesPage({ projectRef: 'project_1', requestUrl: tableUrl, payload: { data: [] } });
    await setCachedEntriesLocations({ projectRef: 'project_1', requestUrl: locationsUrl, payload: { data: {} } });

    clearEntriesApiCache();

    expect(await getCachedEntriesPage({ projectRef: 'project_1', requestUrl: tableUrl })).toBeNull();
    expect(await getCachedEntriesLocations({ projectRef: 'project_1', requestUrl: locationsUrl })).toBeNull();
  });

  it('uses the loaded project ref before falling back to slug', () => {
    expect(getProjectCacheRef({
      projectSlug: 'demo',
      projectDefinition: {
        project: {
          ref: 'project_ref'
        }
      }
    })).toBe('project_ref');

    expect(getProjectCacheRef({
      projectSlug: 'demo',
      projectDefinition: {}
    })).toBe('demo');
  });
});
