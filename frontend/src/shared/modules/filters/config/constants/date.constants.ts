import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';
import { FilterTimeOptions } from '@/shared/modules/filters/types/FilterTimeOptions';
import dayjs from 'dayjs';

export enum FilterDateOperator {
  EQ = 'eq',
  NE = 'ne',
  LT = 'lt',
  GT = 'gt',
  GTE = 'gte',
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
    id: 'olderLast24h',
    value: 'last24h',
    label: 'Older than 24 hours',
    operator: FilterDateOperator.LT,
    getDate: () => dayjs().subtract(24, 'hour').toISOString(),
  },
  {
    id: 'olderLast7days',
    value: 'last7days',
    label: 'Older than 7 days',
    operator: FilterDateOperator.LT,
    getDate: () => dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'olderLast14days',
    value: 'last14days',
    label: 'Older than 14 days',
    operator: FilterDateOperator.LT,
    getDate: () => dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'olderLastMonth',
    value: 'lastMonth',
    label: 'Older than 30 days',
    operator: FilterDateOperator.LT,
    getDate: () => dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'olderLast90days',
    value: 'last90days',
    label: 'Older than 90 days',
    operator: FilterDateOperator.LT,
    getDate: () => dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'last24h',
    value: 'last24h',
    label: 'Last 24 hours',
    operator: FilterDateOperator.GT,
    getDate: () => dayjs().subtract(24, 'hour').toISOString(),
  },
  {
    id: 'last7days',
    value: 'last7days',
    label: 'Last 7 days',
    operator: FilterDateOperator.GT,
    getDate: () => dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'last14days',
    value: 'last14days',
    label: 'Last 14 days',
    operator: FilterDateOperator.GT,
    getDate: () => dayjs().subtract(14, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'lastMonth',
    value: 'lastMonth',
    label: 'Last 30 days',
    operator: FilterDateOperator.GT,
    getDate: () => dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  },
  {
    id: 'last90days',
    value: 'last90days',
    label: 'Last 90 days',
    operator: FilterDateOperator.GT,
    getDate: () => dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
  },
];
