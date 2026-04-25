const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDate = (value) => {
  if (!value) {
    return null;
  }

  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInput = (value) => {
  const parsed = toDate(value);

  if (!parsed) {
    return '';
  }

  return parsed.toISOString().slice(0, 10);
};

const getDatesRange = (startDate, endDate) => {
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (!start || !end || start > end) {
    return [];
  }

  const dates = [];
  const cursor = new Date(start.getTime());

  while (cursor <= end) {
    dates.push(new Date(cursor.getTime()));
    cursor.setTime(cursor.getTime() + DAY_IN_MS);
  }

  return dates;
};

const getDateBounds = ({ projectStats, currentFormRef, projectCreatedAt }) => {
  const formStats = projectStats?.form_counts?.[currentFormRef];
  const fallbackStart = toDate(projectCreatedAt);
  const fallbackEnd = new Date();
  const firstEntry = toDate(formStats?.first_entry_created) || fallbackStart;
  const lastEntry = toDate(formStats?.last_entry_created) || fallbackEnd;

  if (!firstEntry && !lastEntry) {
    return {
      minDate: '',
      maxDate: ''
    };
  }

  const minDate = firstEntry && lastEntry && firstEntry > lastEntry ? lastEntry : firstEntry || lastEntry;
  const maxDate = firstEntry && lastEntry && firstEntry > lastEntry ? firstEntry : lastEntry || firstEntry;

  return {
    minDate: toDateInput(minDate),
    maxDate: toDateInput(maxDate)
  };
};

const filterLocationsByDate = (entries, startDate, endDate) => {
  if (!startDate && !endDate) {
    return entries;
  }

  const lowerBound = startDate ? toDate(`${startDate}T00:00:00`) : null;
  const upperBound = endDate ? toDate(`${endDate}T23:59:59`) : null;

  return entries.filter((entry) => {
    const createdAt = toDate(entry?.properties?.created_at);

    if (!createdAt) {
      return false;
    }

    if (lowerBound && createdAt < lowerBound) {
      return false;
    }

    if (upperBound && createdAt > upperBound) {
      return false;
    }

    return true;
  });
};

const buildPopupContent = ({ count, titles }) => {
  const safeTitles = titles.filter(Boolean).slice(0, 5);

  if (count <= 1) {
    return safeTitles[0] || 'Untitled entry';
  }

  const moreCount = count - safeTitles.length;
  const lines = [`<strong>${count} entries</strong>`];

  if (safeTitles.length > 0) {
    lines.push(safeTitles.join('<br />'));
  }

  if (moreCount > 0) {
    lines.push(`+${moreCount} more`);
  }

  return lines.join('<br />');
};

const buildMarkerItems = (entries, clustered = true) => {
  const buckets = new Map();
  let processedCount = 0;

  entries.forEach((entry, index) => {
    const coordinates = entry?.geometry?.coordinates || [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

    processedCount += 1;

    const key = clustered ? `${latitude}:${longitude}` : `${entry?.properties?.uuid || index}:${latitude}:${longitude}`;
    const bucket = buckets.get(key);
    const title = entry?.properties?.title || 'Untitled entry';

    if (bucket) {
      bucket.count += 1;

      if (bucket.titles.length < 5) {
        bucket.titles.push(title);
      }

      return;
    }

    buckets.set(key, {
      id: entry?.properties?.uuid || `marker-${index}`,
      latitude,
      longitude,
      count: 1,
      title,
      entryUuid: entry?.properties?.uuid || null,
      titles: [title]
    });
  });

  const markers = Array.from(buckets.values()).map((bucket, index) => ({
    id: `${bucket.id}-${index}`,
    latitude: bucket.latitude,
    longitude: bucket.longitude,
    count: bucket.count,
    title: bucket.title,
    entryUuid: bucket.entryUuid,
    popupHtml: buildPopupContent(bucket)
  }));

  const totalEntries = typeof entries?.length === 'number' ? entries.length : 0;

  return {
    markers,
    processedCount,
    totalCount: totalEntries
  };
};

const getMaxRadius = (entriesOrTotal) => {
  const total = Array.isArray(entriesOrTotal) ? entriesOrTotal.length : Number(entriesOrTotal) || 0;

  if (total <= 0) {
    return 30;
  }

  const orderOfMagnitude = total.toString().length;
  const multiplier = Number(total.toString().charAt(0)) || 1;

  return 11 * multiplier * orderOfMagnitude;
};

export default {
  toDateInput,
  getDatesRange,
  getDateBounds,
  filterLocationsByDate,
  buildMarkerItems,
  getMaxRadius
};
