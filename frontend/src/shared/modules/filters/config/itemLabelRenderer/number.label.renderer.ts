import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import {
  FilterNumberOperator,
  numberFilterOperators,
} from '@/shared/modules/filters/config/constants/number.constants';

export const numberItemLabelRenderer = (property: string, {
  value, operator, valueTo,
}: NumberFilterValue): string => {
  const operatorObject = numberFilterOperators.find((o) => o.value === operator);
  let operandText = (operatorObject?.subLabel ? `${operatorObject.subLabel} ` : `${operatorObject?.label} ` || '');
  if (operator === FilterNumberOperator.EQ) {
    operandText = '';
  }
  const isBetween = [FilterNumberOperator.BETWEEN, FilterNumberOperator.NOT_BETWEEN].includes(operator)
  const valueText = isBetween ? `${value} - ${valueTo}` : `${operandText}${value}`;
  return `<b>${property}:</b>${valueText || '...'}`;
};
