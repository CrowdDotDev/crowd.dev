import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import {
  dateFilterTimePickerOptions,
  FilterDateOperator,
} from '@/shared/modules/filters/config/constants/date.constants';
import moment from 'moment';

export const dateApiFilterRenderer = (property: string, { value, operator }: DateFilterValue): any[] => {
  const dateOption = dateFilterTimePickerOptions.find((option) => option.value === value);

  const mappedValue = dateOption ? dateOption.getDate() : value;

  const includeFilter = ![FilterDateOperator.NE, FilterDateOperator.NOT_BETWEEN].includes(operator);
  let filterOperator = operator;

  if (operator === FilterDateOperator.NE) {
    filterOperator = FilterDateOperator.EQ;
  } else if (operator === FilterDateOperator.NOT_BETWEEN) {
    filterOperator = FilterDateOperator.BETWEEN;
  }

  let filter;

  if ([FilterDateOperator.BETWEEN, FilterDateOperator.NOT_BETWEEN].includes(operator)) {
    filter = {
      [property]: {
        [filterOperator]: [
          moment.utc(mappedValue[0]).startOf('day').toISOString(),
          moment.utc(mappedValue[1]).endOf('day').toISOString(),
        ],
      },
    };
  } else if ([FilterDateOperator.EQ, FilterDateOperator.NE].includes(operator)) {
    filter = {
      [property]: {
        between: [
          moment.utc(mappedValue).startOf('day').toISOString(),
          moment.utc(mappedValue).endOf('day').toISOString(),
        ],
      },
    };
  } else {
    let parsedValue = moment.utc(mappedValue).startOf('day').toISOString();

    if (['last24h'].includes(value as string)) {
      parsedValue = mappedValue as string;
    } else if ([FilterDateOperator.GT].includes(operator)) {
      parsedValue = moment.utc(mappedValue).endOf('day').toISOString();
    }

    filter = {
      [property]: {
        [filterOperator]: parsedValue,
      },
    };
  }

  return [
    (includeFilter ? filter : {
      not: filter,
    }),
  ];
};
