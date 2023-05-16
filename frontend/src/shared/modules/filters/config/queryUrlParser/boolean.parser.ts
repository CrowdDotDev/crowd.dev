import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

interface QueryUrlBooleanValue {
  value: string,
  exclude: string,
}

export const booleanQueryUrlParser = (query: QueryUrlBooleanValue): BooleanFilterValue => ({
  exclude: query.exclude === 'true',
  value: query.value === 'true',
});
