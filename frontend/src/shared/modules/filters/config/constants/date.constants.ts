import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';

export enum FilterDateOperator {
  EQ = 'eq',
  LT = 'lt',
  GT = 'gt',
  BETWEEN = 'between',
}

export const dateFilterOperators: FilterOperator[] = [
  {
    label: 'is',
    value: FilterDateOperator.EQ,
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
];
