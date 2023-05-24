import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterOperator } from '@/shared/modules/filters/types/FilterConfig';

interface QueryUrlStringValue {
  operator: FilterOperator,
  value: string,
  include: string,
}

export const stringQueryUrlParser = (query: QueryUrlStringValue): StringFilterValue => ({
  ...query,
  include: query.include === 'true',
});
