import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';
import moment from 'moment';

export const dateApiFilterRenderer = (property: string, { value, include, operator }: DateFilterValue): any[] => {
  let filter = {
    [property]: {
      [operator]: value,
    },
  };
  if (operator === FilterDateOperator.EQ) {
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
    (include ? filter : {
      not: filter,
    }),
  ];
};
