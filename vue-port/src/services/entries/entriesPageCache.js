import lscache from 'lscache';
import PARAMETERS from '@/core/config/parameters';
import client from '@/services/api/client';
import LZString from 'lz-string';

const TABLE_ENTRIES_CACHE_BUCKET = 'ec5-table-entries:';
const MAP_LOCATIONS_CACHE_BUCKET = 'ec5-map-locations:';
const TABLE_ENTRIES_CACHE_TTL_MINUTES = 60;
const TABLE_ENTRIES_CACHE_COMPRESSION = 'lz-string-utf16';
const memoryCache = new Map();
const bucketStorageTracker = new Map(); // Track storage per bucket

const withCacheBucket = (bucket, callback) => {
  lscache.setBucket(bucket);

  try {
    return callback();
  } finally {
    lscache.resetBucket();
  }
};

const withTableEntriesBucket = (callback) => withCacheBucket(TABLE_ENTRIES_CACHE_BUCKET, callback);
const withMapLocationsBucket = (callback) => withCacheBucket(MAP_LOCATIONS_CACHE_BUCKET, callback);

/**
 * Calculate total localStorage usage
 * @returns {Object|null} Object with bytes, kilobytes, and megabytes properties, or null if localStorage unavailable
 */
const getLocalStorageUsage = () => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  let totalBytes = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      totalBytes += localStorage[key].length + key.length;
    }
  }

  return {
    bytes: totalBytes,
    kilobytes: (totalBytes / 1024).toFixed(2),
    megabytes: (totalBytes / (1024 * 1024)).toFixed(2)
  };
};

/**
 * Get storage usage for a specific bucket
 */
const getBucketStorageUsage = (bucket) => {
  if (typeof localStorage === 'undefined') {
    return 0;
  }

  let bucketBytes = 0;

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith(bucket)) {
      bucketBytes += localStorage[key].length + key.length;
    }
  }

  return bucketBytes;
};

/**
 * Internal helper to log cache operation with delta
 */
const logCacheOperationDelta = (operation, bucket, cacheKey) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const usage = getLocalStorageUsage();
  if (!usage) {
    console.warn('[Cache] localStorage not available');
    return;
  }

  const trackedData = bucketStorageTracker.get(bucket);
  const deltaBytes = trackedData?.delta || 0;
  const deltaKB = (deltaBytes / 1024).toFixed(2);

  console.group(`[Cache] ${operation} - ${bucket}`);
  console.log('Cache Key:', cacheKey);
  console.log('Total Storage:', {
    bytes: `${usage.bytes} bytes`,
    kilobytes: `${usage.kilobytes} KB`,
    megabytes: `${usage.megabytes} MB`
  });
  console.log('Bucket Size Change:', {
    bytes: `${deltaBytes > 0 ? '+' : ''}${deltaBytes} bytes`,
    kilobytes: `${deltaBytes > 0 ? '+' : ''}${deltaKB} KB`
  });
  console.groupEnd();
};

export const clearEntriesPageCache = () => {
  // Measure bucket size BEFORE
  const sizeBefore = getBucketStorageUsage(TABLE_ENTRIES_CACHE_BUCKET);

  memoryCache.delete(TABLE_ENTRIES_CACHE_BUCKET);

  withTableEntriesBucket(() => {
    lscache.flush();
  });

  // Measure bucket size AFTER
  const sizeAfter = getBucketStorageUsage(TABLE_ENTRIES_CACHE_BUCKET);
  bucketStorageTracker.set(TABLE_ENTRIES_CACHE_BUCKET, { before: sizeBefore, after: sizeAfter, delta: sizeAfter - sizeBefore });

  logCacheOperationDelta('CLEARED ENTRIES PAGE', TABLE_ENTRIES_CACHE_BUCKET, 'ALL');
};

export const clearEntriesLocationsCache = () => {
  // Measure bucket size BEFORE
  const sizeBefore = getBucketStorageUsage(MAP_LOCATIONS_CACHE_BUCKET);

  memoryCache.delete(MAP_LOCATIONS_CACHE_BUCKET);

  withMapLocationsBucket(() => {
    lscache.flush();
  });

  // Measure bucket size AFTER
  const sizeAfter = getBucketStorageUsage(MAP_LOCATIONS_CACHE_BUCKET);
  bucketStorageTracker.set(MAP_LOCATIONS_CACHE_BUCKET, { before: sizeBefore, after: sizeAfter, delta: sizeAfter - sizeBefore });

  logCacheOperationDelta('CLEARED ENTRIES LOCATIONS', MAP_LOCATIONS_CACHE_BUCKET, 'ALL');
};

export const clearExpiredEntriesPageCache = () => {
  withTableEntriesBucket(() => {
    lscache.flushExpired();
  });
};

export const clearExpiredEntriesLocationsCache = () => {
  withMapLocationsBucket(() => {
    lscache.flushExpired();
  });
};

export const clearEntriesApiCache = () => {
  clearEntriesPageCache();
  clearEntriesLocationsCache();
};

export const getProjectCacheRef = (projectStore) => {
  return projectStore.projectDefinition?.project?.ref
    || projectStore.projectDefinition?.project?.id
    || projectStore.projectSlug
    || '__unknown_project__';
};

export const getPayloadSelfUrl = (payload = {}) => {
  return payload.links?.self || payload.link?.self || '';
};

export const getEntriesRequestUrl = ({ pageUrl = '', projectSlug = '', params = {} } = {}) => {
  if (pageUrl) {
    return new URL(pageUrl, client.defaults.baseURL).toString();
  }

  const requestUrl = client.getUri({
    url: `${PARAMETERS.API_ENTRIES_ENDPOINT}${projectSlug}`,
    params
  });

  return new URL(requestUrl, client.defaults.baseURL).toString();
};

export const getEntriesLocationsRequestUrl = ({ pageUrl = '', projectSlug = '', params = {} } = {}) => {
  if (pageUrl) {
    return new URL(pageUrl, client.defaults.baseURL).toString();
  }

  const requestUrl = client.getUri({
    url: `${PARAMETERS.API_ENTRIES_LOCATIONS_COMPACT_ENDPOINT}${projectSlug}`,
    params
  });

  return new URL(requestUrl, client.defaults.baseURL).toString();
};

export const hashUrl = async (url) => {
  const data = new TextEncoder().encode(normalizeUrlForCache(url));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const normalizeUrlForCache = (url) => {
  const normalizedUrl = new URL(url, client.defaults.baseURL);
  const params = Array.from(normalizedUrl.searchParams.entries())
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }

      return leftKey.localeCompare(rightKey);
    });

  normalizedUrl.search = '';
  params.forEach(([key, value]) => {
    normalizedUrl.searchParams.append(key, value);
  });

  return normalizedUrl.toString();
};

const getMemoryCacheBucket = (bucket) => {
  if (!memoryCache.has(bucket)) {
    memoryCache.set(bucket, new Map());
  }

  return memoryCache.get(bucket);
};

const getMemoryCachePayload = (bucket, cacheKey) => {
  return getMemoryCacheBucket(bucket).get(cacheKey) || null;
};

const setMemoryCachePayload = (bucket, cacheKey, payload) => {
  getMemoryCacheBucket(bucket).set(cacheKey, payload);
};

const setPersistentCachePayload = (bucketWriter, bucket, cacheKey, cachedPayload) => {
  // Measure bucket size BEFORE
  const sizeBefore = getBucketStorageUsage(bucket);

  try {
    bucketWriter(() => {
      lscache.set(
        cacheKey,
        cachedPayload,
        TABLE_ENTRIES_CACHE_TTL_MINUTES
      );
    });
  } catch {
    // Keep the in-memory cache warm even when localStorage quota is exceeded.
  }

  // Measure bucket size AFTER and calculate delta
  const sizeAfter = getBucketStorageUsage(bucket);
  const deltaBytes = sizeAfter - sizeBefore;

  // Store for logging
  bucketStorageTracker.set(bucket, { before: sizeBefore, after: sizeAfter, delta: deltaBytes });
};

const logPackedPayloadSize = (bucket, cacheKey, payload, cachedPayload) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const uncompressedStr = JSON.stringify(payload);
    console.group(`[Cache] Uncompressed payload - ${bucket}`);
    console.log('Cache Key:', cacheKey);
    console.log('Uncompressed JSON length:', uncompressedStr.length, 'chars', `${(uncompressedStr.length / 1024).toFixed(2)} KB`);
    console.groupEnd();
  } catch {
    // ignore stringify errors
  }

  const compressed = cachedPayload.data || '';
  console.group(`[Cache] Compressed payload - ${bucket}`);
  console.log('Cache Key:', cacheKey);
  console.log('Compressed UTF16 length:', compressed.length, 'chars');
  console.log(
    'Estimated localStorage bytes:',
    `${compressed.length * 2} bytes`,
    `${((compressed.length * 2) / 1024).toFixed(2)} KB`
  );
  console.groupEnd();
};

export const getEntriesPageCacheKey = async ({ projectRef, requestUrl }) => {
  return `${projectRef}:${await hashUrl(requestUrl)}`;
};

export const getEntriesLocationsCacheKey = async ({ projectRef, requestUrl }) => {
  return `${projectRef}:${await hashUrl(requestUrl)}`;
};

const packPayload = async (payload) => {
  return {
    compression: TABLE_ENTRIES_CACHE_COMPRESSION,
    data: LZString.compressToUTF16(JSON.stringify(payload))
  };
};

const unpackPayload = async (cachedPayload) => {
  if (!cachedPayload) {
    return null;
  }

  if (cachedPayload.compression !== TABLE_ENTRIES_CACHE_COMPRESSION || !cachedPayload.data) {
    return cachedPayload;
  }

  const decompressed = LZString.decompressFromUTF16(cachedPayload.data);

  if (!decompressed) {
    return null;
  }

  return JSON.parse(decompressed);
};

export const getCachedEntriesPage = async ({ projectRef, requestUrl }) => {
  const cacheKey = await getEntriesPageCacheKey({ projectRef, requestUrl });
  const memoryPayload = getMemoryCachePayload(TABLE_ENTRIES_CACHE_BUCKET, cacheKey);

  if (memoryPayload) {
    return memoryPayload;
  }

  const cachedPayload = withTableEntriesBucket(() => {
    return lscache.get(cacheKey);
  });

  try {
    const payload = await unpackPayload(cachedPayload);

    if (payload) {
      setMemoryCachePayload(TABLE_ENTRIES_CACHE_BUCKET, cacheKey, payload);
    }

    return payload;
  } catch (error) {
    withTableEntriesBucket(() => {
      lscache.remove(cacheKey);
    });

    return null;
  }
};

export const getCachedEntriesLocations = async ({ projectRef, requestUrl }) => {
  const cacheKey = await getEntriesLocationsCacheKey({ projectRef, requestUrl });
  const memoryPayload = getMemoryCachePayload(MAP_LOCATIONS_CACHE_BUCKET, cacheKey);

  if (memoryPayload) {
    return memoryPayload;
  }

  const cachedPayload = withMapLocationsBucket(() => {
    return lscache.get(cacheKey);
  });

  try {
    const payload = await unpackPayload(cachedPayload);

    if (payload) {
      setMemoryCachePayload(MAP_LOCATIONS_CACHE_BUCKET, cacheKey, payload);
    }

    return payload;
  } catch (error) {
    withMapLocationsBucket(() => {
      lscache.remove(cacheKey);
    });

    return null;
  }
};

export const setCachedEntriesPage = async ({ projectRef, requestUrl, payload }) => {
  const cacheKey = await getEntriesPageCacheKey({ projectRef, requestUrl });
  const cachedPayload = await packPayload(payload);

  setMemoryCachePayload(TABLE_ENTRIES_CACHE_BUCKET, cacheKey, payload);
  logPackedPayloadSize(TABLE_ENTRIES_CACHE_BUCKET, cacheKey, payload, cachedPayload);

  setPersistentCachePayload(withTableEntriesBucket, TABLE_ENTRIES_CACHE_BUCKET, cacheKey, cachedPayload);
  logCacheOperationDelta('SET ENTRIES PAGE', TABLE_ENTRIES_CACHE_BUCKET, cacheKey);
};

export const setCachedEntriesLocations = async ({ projectRef, requestUrl, payload }) => {
  const cacheKey = await getEntriesLocationsCacheKey({ projectRef, requestUrl });
  const cachedPayload = await packPayload(payload);

  setMemoryCachePayload(MAP_LOCATIONS_CACHE_BUCKET, cacheKey, payload);
  logPackedPayloadSize(MAP_LOCATIONS_CACHE_BUCKET, cacheKey, payload, cachedPayload);

  setPersistentCachePayload(withMapLocationsBucket, MAP_LOCATIONS_CACHE_BUCKET, cacheKey, cachedPayload);
  logCacheOperationDelta('SET ENTRIES LOCATIONS', MAP_LOCATIONS_CACHE_BUCKET, cacheKey);
};

/**
 * Return array of keys in a bucket with their sizes (bytes)
 */
const getBucketKeysAndSizes = () => {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  const results = [];
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && (key.startsWith(TABLE_ENTRIES_CACHE_BUCKET) || key.startsWith(MAP_LOCATIONS_CACHE_BUCKET))) {
      const bytes = localStorage[key].length + key.length;
      results.push({ key, bytes, kilobytes: (bytes / 1024).toFixed(2) });
    }
  }

  return results.sort((a, b) => b.bytes - a.bytes);
};

const logBucketDetails = (bucket) => {
  if (process.env.NODE_ENV !== 'development') return;

  const keys = [];
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith(bucket)) {
      const bytes = localStorage[key].length + key.length;
      keys.push({ key, bytes, kilobytes: (bytes / 1024).toFixed(2) });
    }
  }

  if (keys.length === 0) {
    console.log(`[Cache] ${bucket} has no localStorage entries`);
    return;
  }

  console.group(`[Cache] Bucket details - ${bucket}`);
  let total = 0;
  keys.sort((a, b) => b.bytes - a.bytes).forEach((k) => {
    console.log(k.key, `${k.bytes} bytes`, `${k.kilobytes} KB`);
    total += k.bytes;
  });
  console.log('Bucket total:', `${total} bytes`, `${(total / 1024).toFixed(2)} KB`);
  console.groupEnd();
};
