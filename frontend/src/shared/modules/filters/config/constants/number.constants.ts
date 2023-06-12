import { FilterOperator } from '@/shared/modules/filters/types/FilterOperator';

export enum FilterNumberOperator {
  EQ = 'eq',
  LT = 'lt',
  LTE = 'lte',
  GT = 'gt',
  GTE = 'gte',
  BETWEEN = 'between',
}

export const numberFilterOperators: FilterOperator[] = [
  {
    label: 'is',
    value: FilterNumberOperator.EQ,
  },
  {
    label: 'less than',
    subLabel: '<',
    value: FilterNumberOperator.LT,
  },
  {
    label: 'equal or less than',
    subLabel: '<=',
    value: FilterNumberOperator.LTE,
  },
  {
    label: 'greater than',
    subLabel: '>',
    value: FilterNumberOperator.GT,
  },
  {
    label: 'equal or greater than',
    subLabel: '>=',
    value: FilterNumberOperator.GTE,
  },
  {
    label: 'between',
    value: FilterNumberOperator.BETWEEN,
  },
];
