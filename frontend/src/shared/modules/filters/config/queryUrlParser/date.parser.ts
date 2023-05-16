import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

interface QueryUrlDateValue {
  operator: string,
  value: string,
  exclude: string,
}

export const dateQueryUrlParser = (query: QueryUrlDateValue): DateFilterValue => ({
  ...query,
  exclude: query.exclude === 'true',
});
