import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { stringOperatorLabels } from '@/shared/modules/filters/config/constants/string.constants';

export const stringItemLabelRenderer = (
  property: string,
  { value, include, operator }: StringFilterValue,
): string => {
  const excludeText = !include ? ' (exclude)' : '';

  return `<b>${property}${excludeText}:</b> ${stringOperatorLabels[operator]} ${value}`;
};
