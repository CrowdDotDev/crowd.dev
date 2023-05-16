import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';

interface QueryUrlNumberValue {
  operator: string,
  value: string,
  exclude: string,
}

export const numberQueryUrlParser = (query: QueryUrlNumberValue): NumberFilterValue => ({
  ...query,
  exclude: query.exclude === 'true',
  value: +query.value,
});
