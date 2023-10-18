import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';
import { FilterTimeOptions } from '@/shared/modules/filters/types/FilterTimeOptions';
import moment from 'moment/moment';

export enum FilterDateOperator {
  EQ = 'eq',
  NE = 'ne',
  LT = 'lt',
  GT = 'gt',
  BETWEEN = 'between',
  NOT_BETWEEN = 'not-between',
}

export const dateFilterOperators: FilterOperator[] = [
  {
    label: 'is',
    value: FilterDateOperator.EQ,
  },
  {
    label: 'is not',
    value: FilterDateOperator.NE,
  },
  {
    label: 'is before',
    value: FilterDateOperator.LT,
  },
  {
    label: 'is after',
    value: FilterDateOperator.GT,
  },
  {
    label: 'between',
    value: FilterDateOperator.BETWEEN,
  },
  {
    label: 'not between',
    value: FilterDateOperator.NOT_BETWEEN,
  },
];

export const dateFilterTimePickerOptions: FilterTimeOptions[] = [
  {
    value: 'lastweek',
    label: 'Last week',
    getDate: () => moment().subtract(1, 'week').format('YYYY-MM-DD'),

  },
  {
    value: 'lastmonth',
    label: 'Last month',
    getDate: () => moment().subtract(1, 'month').format('YYYY-MM-DD'),

  },
  {
    value: 'lastyear',
    label: 'Last year',
    getDate: () => moment().subtract(1, 'year').format('YYYY-MM-DD'),

  },
];
