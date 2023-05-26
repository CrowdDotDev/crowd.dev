import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { FilterStringOperator, stringOperatorLabels } from '@/shared/modules/filters/config/constants/string.constants';

export const stringItemLabelRenderer = (
  property: string,
  { value, include, operator }: StringFilterValue,
): string => {
  const excludeText = !include ? ' (exclude)' : '';
  const valueText = operator !== FilterStringOperator.EQ ? `${stringOperatorLabels[operator]} ${value}` : value;

  return `<b>${property}${excludeText}:</b>${valueText}`;
};
