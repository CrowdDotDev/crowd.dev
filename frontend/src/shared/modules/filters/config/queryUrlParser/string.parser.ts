import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

interface QueryUrlStringValue {
  operator: FilterStringOperator,
  value: string,
  include: string,
}

export const stringQueryUrlParser = (query: QueryUrlStringValue): StringFilterValue => ({
  ...query,
  include: query.include === 'true',
});
