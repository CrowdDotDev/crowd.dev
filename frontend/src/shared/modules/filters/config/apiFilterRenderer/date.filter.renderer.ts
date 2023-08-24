import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';
import moment from 'moment';

export const dateApiFilterRenderer = (property: string, { value, operator }: DateFilterValue): any[] => {
  const includeFilter = ![FilterDateOperator.NE, FilterDateOperator.NOT_BETWEEN].includes(operator);
  let filterOperator = operator;

  if (operator === FilterDateOperator.NE) {
    filterOperator = FilterDateOperator.EQ;
  } else if (operator === FilterDateOperator.NOT_BETWEEN) {
    filterOperator = FilterDateOperator.BETWEEN;
  }

  let filter = {
    [property]: {
      [filterOperator]: value,
    },
  };
  if ([FilterDateOperator.EQ, FilterDateOperator.NE].includes(operator)) {
    filter = {
      [property]: {
        between: [
          moment.utc(value).startOf('day').toISOString(),
          moment.utc(value).endOf('day').toISOString(),
        ],
      },
    };
  }

  return [
    (includeFilter ? filter : {
      not: filter,
    }),
  ];
};
