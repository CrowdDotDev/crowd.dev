import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterNumberOperator } from '@/shared/modules/filters/config/constants/number.constants';

export const numberApiFilterRenderer = (property: string, {
  value, valueTo, operator,
}: NumberFilterValue): any[] => {
  const includeFilter = ![FilterNumberOperator.NE, FilterNumberOperator.NOT_BETWEEN].includes(operator);

  const filterValue = [FilterNumberOperator.BETWEEN, FilterNumberOperator.NOT_BETWEEN].includes(operator) ? [+value, +valueTo!] : +value;
  const filter = {
    [property]: {
      [operator]: filterValue,
    },
  };

  return [
    (includeFilter ? filter : {
      not: filter,
    }),
  ];
};
