import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

interface QueryUrlStringValue {
  operator: string,
  value: string,
  include: string,
}

export const stringQueryUrlParser = (query: QueryUrlStringValue): StringFilterValue => ({
  ...query,
  include: query.include === 'true',
});
