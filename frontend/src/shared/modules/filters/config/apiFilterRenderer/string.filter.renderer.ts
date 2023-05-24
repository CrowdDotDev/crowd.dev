import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterOperator } from '../../types/FilterConfig';

export const stringApiFilterRenderer = (property: string, { include, value, operator }: StringFilterValue): any[] => {
  // Exception for "not contains" where there isn't a specific operator
  const filter = operator === FilterOperator.NLIKE ? {
    not: {
      contains: value,
    },
  } : {
    [operator]: value,
  };

  return [
    {
      [property]: (include ? filter : {
        not: {
          filter,
        },
      }),
    },
  ];
};
