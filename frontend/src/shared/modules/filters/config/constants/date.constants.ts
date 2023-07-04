import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';

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
