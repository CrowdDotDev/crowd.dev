import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import {
  dateFilterTimePickerOptions,
  FilterDateOperator,
} from '@/shared/modules/filters/config/constants/date.constants';

const operatorText: Record<FilterDateOperator, string> = {
  [FilterDateOperator.EQ]: '',
  [FilterDateOperator.NE]: 'is not',
  [FilterDateOperator.LT]: 'before',
  [FilterDateOperator.GT]: 'after',
  [FilterDateOperator.BETWEEN]: '',
  [FilterDateOperator.NOT_BETWEEN]: 'not between',
};

export const dateItemLabelRenderer = (property: string, { value, operator }: DateFilterValue): string => {
  const dateOption = dateFilterTimePickerOptions.find((option) => option.value === value);
  let valueText = `${value}`;
  let operatorTextDisplay = operatorText[operator].length > 0 ? `${operatorText[operator]} ` : '';

  if (dateOption) {
    valueText = dateOption.label.toLowerCase();
    operatorTextDisplay = 'in ';
  } else {
    const isBetween = [FilterDateOperator.BETWEEN, FilterDateOperator.NOT_BETWEEN].includes(operator);
    if (isBetween) {
      const [from, to] = value;
      valueText = `${from}<span class="ri-arrow-right-line text-base ml-1">&nbsp;</span>${to}`;
    }
  }

  return `<b>${property}:</b>${operatorTextDisplay}${valueText || '...'}`;
};
