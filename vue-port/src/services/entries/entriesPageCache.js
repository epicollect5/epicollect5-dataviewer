import lscache from 'lscache';
import PARAMETERS from '@/core/config/parameters';
import client from '@/services/api/client';

const TABLE_ENTRIES_CACHE_BUCKET = 'ec5-table-entries:';
const MAP_LOCATIONS_CACHE_BUCKET = 'ec5-map-locations:';
const TABLE_ENTRIES_CACHE_TTL_MINUTES = 60;
const TABLE_ENTRIES_CACHE_COMPRESSION = 'gzip';

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

export const clearEntriesPageCache = () => {
  withTableEntriesBucket(() => {
    lscache.flush();
  });
};

export const clearEntriesLocationsCache = () => {
  withMapLocationsBucket(() => {
    lscache.flush();
  });
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

export const getEntriesLocationsRequestUrl = ({ projectSlug = '', params = {} } = {}) => {
  const requestUrl = client.getUri({
    url: `${PARAMETERS.API_ENTRIES_LOCATIONS_ENDPOINT}${projectSlug}`,
    params
  });

  return new URL(requestUrl, client.defaults.baseURL).toString();
};

export const hashUrl = async (url) => {
  const data = new TextEncoder().encode(url);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const getEntriesPageCacheKey = async ({ projectRef, requestUrl }) => {
  return `${projectRef}:${await hashUrl(requestUrl)}`;
};

export const getEntriesLocationsCacheKey = async ({ projectRef, requestUrl }) => {
  return `${projectRef}:${await hashUrl(requestUrl)}`;
};

const bytesToBase64 = (bytes) => {
  if (typeof btoa !== 'function') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const base64ToBytes = (value) => {
  if (typeof atob !== 'function') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

export const compress = async (text) => {
  const stream = new Response(text).body
    .pipeThrough(new CompressionStream(TABLE_ENTRIES_CACHE_COMPRESSION));
  const buffer = await new Response(stream).arrayBuffer();

  return new Uint8Array(buffer);
};

export const decompress = async (bytes) => {
  const stream = new Response(bytes).body
    .pipeThrough(new DecompressionStream(TABLE_ENTRIES_CACHE_COMPRESSION));

  return new Response(stream).text();
};

const packPayload = async (payload) => {
  return {
    compression: TABLE_ENTRIES_CACHE_COMPRESSION,
    data: bytesToBase64(await compress(JSON.stringify(payload)))
  };
};

const unpackPayload = async (cachedPayload) => {
  if (!cachedPayload) {
    return null;
  }

  if (cachedPayload.compression !== TABLE_ENTRIES_CACHE_COMPRESSION || !cachedPayload.data) {
    return cachedPayload;
  }

  return JSON.parse(await decompress(base64ToBytes(cachedPayload.data)));
};

export const getCachedEntriesPage = async ({ projectRef, requestUrl }) => {
  const cacheKey = await getEntriesPageCacheKey({ projectRef, requestUrl });
  const cachedPayload = withTableEntriesBucket(() => {
    return lscache.get(cacheKey);
  });

  try {
    return await unpackPayload(cachedPayload);
  } catch (error) {
    withTableEntriesBucket(() => {
      lscache.remove(cacheKey);
    });

    return null;
  }
};

export const getCachedEntriesLocations = async ({ projectRef, requestUrl }) => {
  const cacheKey = await getEntriesLocationsCacheKey({ projectRef, requestUrl });
  const cachedPayload = withMapLocationsBucket(() => {
    return lscache.get(cacheKey);
  });

  try {
    return await unpackPayload(cachedPayload);
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

  withTableEntriesBucket(() => {
    lscache.set(
      cacheKey,
      cachedPayload,
      TABLE_ENTRIES_CACHE_TTL_MINUTES
    );
  });
};

export const setCachedEntriesLocations = async ({ projectRef, requestUrl, payload }) => {
  const cacheKey = await getEntriesLocationsCacheKey({ projectRef, requestUrl });
  const cachedPayload = await packPayload(payload);

  withMapLocationsBucket(() => {
    lscache.set(
      cacheKey,
      cachedPayload,
      TABLE_ENTRIES_CACHE_TTL_MINUTES
    );
  });
};
