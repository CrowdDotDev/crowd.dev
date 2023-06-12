import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import {
  FilterNumberOperator,
  numberFilterOperators,
} from '@/shared/modules/filters/config/constants/number.constants';

export const numberItemLabelRenderer = (property: string, {
  value, include, operator, valueTo,
}: NumberFilterValue): string => {
  const excludeText = !include ? ' (exclude)' : '';
  const operatorObject = numberFilterOperators.find((o) => o.value === operator);
  const operandText = operatorObject?.subLabel ? `${operatorObject.subLabel} ` : '';
  const valueText = operator === FilterNumberOperator.BETWEEN ? `${value} - ${valueTo}` : `${operandText}${value}`;
  return `<b>${property}${excludeText}:</b>${valueText || '...'}`;
};
