export const CLUSTER_PIE_EMPTY_COLOR = '#c159b3';
export const CLUSTER_PIE_INNER_BACKGROUND = '#ffffff';
const HEX_COLOR_CHARS = '0123456789ABCDEF';

const getAnswerLabel = (answer) => {
  if (typeof answer === 'string' || typeof answer === 'number') {
    return `${answer}`;
  }

  return answer?.answer || answer?.value || answer?.map_to || answer?.label || '';
};

export const buildPieChartLegend = (answers = {}) => {
  return Object.entries(answers).map(([answerRef, answer]) => ({
    answerRef,
    answer: getAnswerLabel(answer),
    color: getRandomColor()
  }));
};

export const getRandomColor = () => {
  let length = 6;
  let hex = '#';

  while (length > 0) {
    hex += HEX_COLOR_CHARS[(Math.random() * 16) | 0];
    length -= 1;
  }

  return hex;
};

export const getPieBackground = ({ segments, total, emptyColor = CLUSTER_PIE_EMPTY_COLOR }) => {
  const visibleSegments = segments.filter((segment) => segment.count > 0);

  if (visibleSegments.length === 0 || total === 0) {
    return emptyColor;
  }

  if (visibleSegments.length === 1) {
    return visibleSegments[0].color;
  }

  let start = 0;
  const stops = visibleSegments.map((segment) => {
    const end = start + (segment.count / total) * 360;
    const stop = `${segment.color} ${start}deg ${end}deg`;
    start = end;

    return stop;
  });

  return `conic-gradient(${stops.join(', ')})`;
};

export const getClusterPieSegments = ({ markers, legend }) => {
  const segments = [];
  let total = 0;

  legend.forEach((legendItem) => {
    const answerRef = legendItem.answerRef;
    let count = 0;

    markers.forEach((marker) => {
      if (marker.options.possibleAnswers?.[answerRef]) {
        count += 1;
      }
    });

    if (count > 0) {
      segments.push({
        color: legendItem.color,
        count
      });
      total += count;
    }
  });

  return {
    segments,
    total
  };
};

export const getClusterPieIconModel = ({ markers, legend }) => {
  const pie = getClusterPieSegments({ markers, legend });
  const label = pie.total;
  const size = (parseInt(label.toString().length, 10) + 2) * 10;
  const innerSize = pie.total > 0 ? Math.round(size * 0.56) : size;
  const background = getPieBackground({
    segments: pie.segments,
    total: pie.total
  });

  return {
    label,
    size,
    innerSize,
    background,
    innerBackground: pie.total > 0 ? CLUSTER_PIE_INNER_BACKGROUND : CLUSTER_PIE_EMPTY_COLOR
  };
};

export const getClusterPieIconHtml = (model) => {
  return `<div class="marker-cluster-pie__chart" style="width: ${model.size}px; height: ${model.size}px; background: ${model.background};"><span class="marker-cluster-pie__inner" style="width: ${model.innerSize}px; height: ${model.innerSize}px; background: ${model.innerBackground};">${model.label}</span></div>`;
};
