import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

interface QueryUrlMultiSelectValue {
  value: string,
  exclude: string,
}

export const multiSelectQueryUrlParser = (query: QueryUrlMultiSelectValue): MultiSelectFilterValue => ({
  ...query,
  value: query.value.split(','),
  exclude: query.exclude === 'true',
});
