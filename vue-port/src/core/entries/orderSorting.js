import PARAMETERS from '@/core/config/parameters';

const ORDER_MAP = {
  [PARAMETERS.ORDER_BY.NEWEST]: {
    sortBy: 'created_at',
    sortOrder: 'DESC'
  },
  [PARAMETERS.ORDER_BY.OLDEST]: {
    sortBy: 'created_at',
    sortOrder: 'ASC'
  },
  [PARAMETERS.ORDER_BY.AZ]: {
    sortBy: 'title',
    sortOrder: 'ASC'
  },
  [PARAMETERS.ORDER_BY.ZA]: {
    sortBy: 'title',
    sortOrder: 'DESC'
  }
};

export const getOrderSorting = (selectedOrderBy) => {
  return ORDER_MAP[selectedOrderBy] || ORDER_MAP[PARAMETERS.ORDER_BY.NEWEST];
};
