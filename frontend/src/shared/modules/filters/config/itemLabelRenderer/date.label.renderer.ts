import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { FilterDateOperator } from '@/shared/modules/filters/config/constants/date.constants';

export const dateItemLabelRenderer = (property: string, { value, operator, include }: DateFilterValue): string => {
  const excludeText = !include ? ' (exclude)' : '';
  let valueText = '';
  if (operator === FilterDateOperator.BETWEEN) {
    const [from, to] = value;
    valueText = `${from}<span class="ri-arrow-right-line text-base ml-1">&nbsp;</span>${to}`;
  } else if (operator === FilterDateOperator.LT) {
    valueText = `before ${value}`;
  } else if (operator === FilterDateOperator.GT) {
    valueText = `after ${value}`;
  } else {
    valueText = value as string;
  }
  return `<b>${property}${excludeText}:</b>${valueText || '...'}`;
};
