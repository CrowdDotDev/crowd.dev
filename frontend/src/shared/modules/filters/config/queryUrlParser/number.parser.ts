import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterNumberOperator } from '@/shared/modules/filters/config/constants/number.constants';

interface QueryUrlNumberValue {
  operator: string,
  value: string,
  valueTo: string,
  include: string,
}

export const numberQueryUrlParser = (query: QueryUrlNumberValue): NumberFilterValue => ({
  operator: query.operator as FilterNumberOperator,
  include: query.include === 'true',
  value: +query.value,
  valueTo: +query.valueTo || '',
});
