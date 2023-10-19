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
    value: 'last7days',
    label: 'Last 7 days',
    getDate: () => moment().subtract(1, 'week').format('YYYY-MM-DD'),
  },
  {
    value: 'last14days',
    label: 'Last 14 days',
    getDate: () => moment().subtract(14, 'day').format('YYYY-MM-DD'),
  },
  {
    value: 'lastMonth',
    label: 'Last 30 days',
    getDate: () => moment().subtract(30, 'day').format('YYYY-MM-DD'),
  },
  {
    value: 'last90days',
    label: 'Last 90 days',
    getDate: () => moment().subtract(90, 'day').format('YYYY-MM-DD'),
  },
];
