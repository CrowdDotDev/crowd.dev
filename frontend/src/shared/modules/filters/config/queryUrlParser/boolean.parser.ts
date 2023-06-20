import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

interface QueryUrlBooleanValue {
  value: string,
  include: string,
}

export const booleanQueryUrlParser = (query: QueryUrlBooleanValue): BooleanFilterValue => ({
  include: query.include === 'true',
  value: query.value === 'true',
});
