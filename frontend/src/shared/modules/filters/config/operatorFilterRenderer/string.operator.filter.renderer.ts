import { FilterOperator } from '@/shared/modules/filters/types/FilterConfig';
import { labelOperatorRenderer } from './label.operator.filter.renderer';

export const stringOperatorFilterRenderer = (value: FilterOperator) => [
  {
    label: labelOperatorRenderer[FilterOperator.EQ],
    value: FilterOperator.EQ,
    selected: value === FilterOperator.EQ,
  },
  {
    label: labelOperatorRenderer[FilterOperator.NE],
    value: FilterOperator.NE,
    selected: value === FilterOperator.NE,
  },
  {
    label: labelOperatorRenderer[FilterOperator.LIKE],
    value: FilterOperator.LIKE,
    selected: value === FilterOperator.LIKE,
  },
  {
    label: labelOperatorRenderer[FilterOperator.NLIKE],
    value: FilterOperator.NLIKE,
    selected: value === FilterOperator.NLIKE,
  },
];
