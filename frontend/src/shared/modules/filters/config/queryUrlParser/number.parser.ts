import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';

interface QueryUrlNumberValue {
  operator: string,
  value: string,
  include: string,
}

export const numberQueryUrlParser = (query: QueryUrlNumberValue): NumberFilterValue => ({
  ...query,
  include: query.include === 'true',
  value: +query.value,
});
