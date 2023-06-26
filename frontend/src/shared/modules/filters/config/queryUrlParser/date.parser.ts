import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';

interface QueryUrlDateValue {
  operator: string,
  value: string,
  include: string,
}

export const dateQueryUrlParser = (query: QueryUrlDateValue): DateFilterValue => ({
  ...query,
  operator: query.operator as FilterDateOperator,
  value: query.operator === FilterDateOperator.BETWEEN ? query.value.split(',') : query.value,
});
