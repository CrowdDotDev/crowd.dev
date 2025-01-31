import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import {
  dateFilterTimePickerOptions,
  FilterDateOperator,
} from '@/shared/modules/filters/config/constants/date.constants';
import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc';
import arraySupportPlugin from 'dayjs/plugin/arraySupport';

dayjs.extend(utcPlugin);
dayjs.extend(arraySupportPlugin);

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
          dayjs.utc(mappedValue[0]).startOf('day').toISOString(),
          dayjs.utc(mappedValue[1]).endOf('day').toISOString(),
        ],
      },
    };
  } else if ([FilterDateOperator.EQ, FilterDateOperator.NE].includes(operator)) {
    filter = {
      [property]: {
        between: [
          dayjs.utc(mappedValue).startOf('day').toISOString(),
          dayjs.utc(mappedValue).endOf('day').toISOString(),
        ],
      },
    };
  } else {
    let parsedValue = dayjs.utc(mappedValue).startOf('day').toISOString();

    if (['last24h'].includes(value as string)) {
      parsedValue = mappedValue as string;
    } else if ([FilterDateOperator.GT, FilterDateOperator.GTE].includes(operator)) {
      parsedValue = dayjs.utc(mappedValue).endOf('day').toISOString();
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
