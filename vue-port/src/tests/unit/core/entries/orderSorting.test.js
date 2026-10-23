import { getOrderSorting } from '@/core/entries/orderSorting';
import PARAMETERS from '@/core/config/parameters';

describe('core/entries/orderSorting', () => {
  it('maps every order option to its sorting', () => {
    expect(getOrderSorting(PARAMETERS.ORDER_BY.NEWEST)).toEqual({
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });

    expect(getOrderSorting(PARAMETERS.ORDER_BY.OLDEST)).toEqual({
      sortBy: 'created_at',
      sortOrder: 'ASC'
    });

    expect(getOrderSorting(PARAMETERS.ORDER_BY.AZ)).toEqual({
      sortBy: 'title',
      sortOrder: 'ASC'
    });

    expect(getOrderSorting(PARAMETERS.ORDER_BY.ZA)).toEqual({
      sortBy: 'title',
      sortOrder: 'DESC'
    });
  });

  it('falls back to the newest ordering for an unknown option', () => {
    expect(getOrderSorting('unknown')).toEqual({
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  });
});
