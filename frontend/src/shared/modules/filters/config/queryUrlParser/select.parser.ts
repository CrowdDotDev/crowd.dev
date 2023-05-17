import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

interface QueryUrlSelectValue {
  value: string,
  exclude: string,
}

export const selectQueryUrlParser = (query: QueryUrlSelectValue): SelectFilterValue => ({
  ...query,
  exclude: query.exclude === 'true',
});
