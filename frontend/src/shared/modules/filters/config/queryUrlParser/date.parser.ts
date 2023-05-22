import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

interface QueryUrlDateValue {
  operator: string,
  value: string,
  include: string,
}

export const dateQueryUrlParser = (query: QueryUrlDateValue): DateFilterValue => ({
  ...query,
  include: query.include === 'true',
});
