import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';
import moment from 'moment';

export const dateApiFilterRenderer = (property: string, { value, operator }: DateFilterValue): any[] => {
  let includeFilter = ![FilterDateOperator.NE, FilterDateOperator.NOT_BETWEEN].includes(operator);

  let filter = {
    [property]: {
      [operator]: value,
    },
  };
  if ([FilterDateOperator.EQ, FilterDateOperator.NE].includes(operator)) {
    filter = {
      [property]: {
        between: [
          moment(value).startOf('day').toISOString(),
          moment(value).endOf('day').toISOString(),
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
