import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { labelOperatorRenderer } from '../operatorFilterRenderer/label.operator.filter.renderer';

export const stringItemLabelRenderer = (
  property: string,
  { value, include, operator }: StringFilterValue,
): string => {
  const excludeText = !include ? ' (exclude)' : '';

  return `<b>${property}${excludeText}:</b> ${labelOperatorRenderer[operator]} ${value}`;
};
