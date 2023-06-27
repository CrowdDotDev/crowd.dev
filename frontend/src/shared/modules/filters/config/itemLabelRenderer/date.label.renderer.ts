import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';

const operatorText: Record<FilterDateOperator, string> = {
  [FilterDateOperator.EQ]: '',
  [FilterDateOperator.NE]: 'is not',
  [FilterDateOperator.LT]: 'before',
  [FilterDateOperator.GT]: 'after',
  [FilterDateOperator.BETWEEN]: '',
  [FilterDateOperator.NOT_BETWEEN]: 'not between',
};

export const dateItemLabelRenderer = (property: string, { value, operator }: DateFilterValue): string => {
  let valueText = `${value}`;
  const isBetween = [FilterDateOperator.BETWEEN, FilterDateOperator.NOT_BETWEEN].includes(operator);
  if (isBetween) {
    const [from, to] = value;
    valueText = `${from}<span class="ri-arrow-right-line text-base ml-1">&nbsp;</span>${to}`;
  }
  return `<b>${property}:</b>${operatorText[operator].length > 0 ? `${operatorText[operator]} ` : ''}${valueText || '...'}`;
};
