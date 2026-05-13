import { getPieBackground } from '@/services/map/pieCharts';

const DISTRIBUTION_EMPTY_COLOR = '#d8dbe2';

export const buildDistributionChart = ({ entries, legend, selectedDistributionQuestion }) => {
  if (!selectedDistributionQuestion || legend.length === 0) {
    return null;
  }

  const distribution = {};
  let total = 0;

  legend.forEach((legendItem) => {
    distribution[legendItem.answerRef] = 0;
  });

  entries.forEach((entry) => {
    const possibleAnswers = entry?.properties?.possible_answers || {};

    legend.forEach((legendItem) => {
      if (possibleAnswers[legendItem.answerRef]) {
        distribution[legendItem.answerRef] += 1;
        total += 1;
      }
    });
  });

  const rows = legend.map((legendItem) => ({
    ...legendItem,
    total: distribution[legendItem.answerRef] || 0
  }));

  return {
    total,
    rows
  };
};

export const getDistributionDonutBackground = ({ rows, total }) => {
  return getPieBackground({
    segments: rows.map((row) => ({
      color: row.color,
      count: row.total
    })),
    total,
    emptyColor: DISTRIBUTION_EMPTY_COLOR
  });
};

export const getDistributionSwatchStyle = (row) => ({
  background: row.color
});
