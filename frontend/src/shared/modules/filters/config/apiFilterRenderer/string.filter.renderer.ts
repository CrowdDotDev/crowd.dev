import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

export const stringApiFilterRenderer = (property: string, { include, value, operator }: StringFilterValue): any[] => {
  // Exception for "not contains" where there isn't a specific operator
  const filter = operator === FilterStringOperator.NLIKE ? {
    not: {
      contains: value,
    },
  } : {
    [operator]: value,
  };

  return [
    {
      [property]: (include ? filter : {
        not: filter,
      }),
    },
  ];
};
