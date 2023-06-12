import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

export const stringApiFilterRenderer = (property: string, { include, value, operator }: StringFilterValue): any[] => {
  // Exception for "not contains" where there isn't a specific operator
  let filter: any = {
    [operator]: value,
  };
  if (operator === FilterStringOperator.LIKE || operator === FilterStringOperator.NLIKE) {
    filter = {
      like: `%${value}%`,
    };
  }

  filter = {
    [property]: filter,
  };

  return [
    (include && operator !== FilterStringOperator.NLIKE ? filter : {
      not: filter,
    }),
  ];
};
