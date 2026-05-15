import { getPieBackground } from '@/services/map/pieCharts';
import { locationHasPossibleAnswer } from '@/core/map/compactLocations';

const DISTRIBUTION_EMPTY_COLOR = '#d8dbe2';

export const buildDistributionChart = ({ entries, legend, selectedDistributionQuestion, possibleAnswerMap = [] }) => {
  if (!selectedDistributionQuestion || legend.length === 0) {
    return null;
  }

  const distribution = {};
  let total = 0;

  legend.forEach((legendItem) => {
    distribution[legendItem.answerRef] = 0;
  });

  entries.forEach((entry) => {
    legend.forEach((legendItem) => {
      if (locationHasPossibleAnswer(entry, legendItem.answerRef, possibleAnswerMap)) {
        distribution[legendItem.answerRef] += 1;
        total += 1;
      }
    });
  });

  const rows = legend.map(({ possibleAnswerIndex, ...legendItem }) => ({
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
