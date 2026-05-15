const padDatePart = (value) => value.toString().padStart(2, '0');

export const compactDateToCreatedAt = (dateValue) => {
  const normalizedDate = Number(dateValue);

  if (!Number.isInteger(normalizedDate)) {
    return '';
  }

  const year = Math.floor(normalizedDate / 10000);
  const month = Math.floor((normalizedDate % 10000) / 100);
  const day = normalizedDate % 100;

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }

  return `${year}-${padDatePart(month)}-${padDatePart(day)} 00:00:00`;
};

export const decodePossibleAnswers = (possibleAnswerIndexes = [], possibleAnswerMap = []) => {
  const decodedAnswers = {};

  if (!Array.isArray(possibleAnswerIndexes) || !Array.isArray(possibleAnswerMap)) {
    return decodedAnswers;
  }

  possibleAnswerIndexes.forEach((possibleAnswerIndex) => {
    const answerRef = possibleAnswerMap[possibleAnswerIndex];

    if (answerRef) {
      decodedAnswers[answerRef] = 1;
    }
  });

  return decodedAnswers;
};

export const getLocationCoordinates = (entry = {}) => {
  if (Array.isArray(entry.geometry?.coordinates)) {
    return entry.geometry.coordinates;
  }

  return [entry.x, entry.y];
};

export const getLocationUuid = (entry = {}) => entry.properties?.uuid || entry.u || null;

export const getLocationTitle = (entry = {}) => entry.properties?.title || entry.title || getLocationUuid(entry) || '';

export const getLocationCreatedAt = (entry = {}) => entry.properties?.created_at || compactDateToCreatedAt(entry.d);

export const locationHasPossibleAnswer = (entry = {}, answerRef, possibleAnswerMap = []) => {
  if (!answerRef) {
    return false;
  }

  if (entry.properties?.possible_answers?.[answerRef]) {
    return true;
  }

  if (!Array.isArray(entry.pa) || !Array.isArray(possibleAnswerMap)) {
    return false;
  }

  return entry.pa.some((possibleAnswerIndex) => possibleAnswerMap[possibleAnswerIndex] === answerRef);
};

const getPossibleAnswerMap = (payload = {}) => payload.data?.pa_map || [];

const haveSamePossibleAnswerMap = (leftMap = [], rightMap = []) => {
  if (leftMap.length !== rightMap.length) {
    return false;
  }

  return leftMap.every((answerRef, index) => answerRef === rightMap[index]);
};

export const mergeCompactLocationPayloads = (payloads = []) => {
  const firstPayload = payloads[0] || {};
  const possibleAnswerMap = getPossibleAnswerMap(firstPayload);
  const points = [];

  payloads.forEach((payload, index) => {
    const nextPossibleAnswerMap = getPossibleAnswerMap(payload);

    if (!haveSamePossibleAnswerMap(possibleAnswerMap, nextPossibleAnswerMap)) {
      throw new Error(`Compact location possible-answer map mismatch on chunk ${index + 1}`);
    }

    points.push(...(payload.data?.points || []));
  });

  return {
    ...firstPayload,
    data: {
      ...(firstPayload.data || {}),
      pa_map: possibleAnswerMap,
      points
    },
    meta: firstPayload.meta || null,
    links: {
      ...(firstPayload.links || firstPayload.link || {}),
      prev: null,
      next: null
    }
  };
};
