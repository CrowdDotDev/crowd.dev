import { FilterOperator } from '@/shared/modules/filters/types/FilterConfig';

export const labelOperatorRenderer = {
  [FilterOperator.EQ]: 'is',
  [FilterOperator.NE]: 'is not',
  [FilterOperator.LIKE]: 'contains',
  [FilterOperator.NLIKE]: 'not contains',
};
