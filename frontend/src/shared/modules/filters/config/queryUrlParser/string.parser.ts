import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

interface QueryUrlStringValue {
  operator: string,
  value: string,
}

export const stringQueryUrlParser = (query: QueryUrlStringValue): StringFilterValue => ({
  ...query,
  operator: query.operator as FilterStringOperator,
});
