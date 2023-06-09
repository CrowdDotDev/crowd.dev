import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

export const booleanItemLabelRenderer = (property: string, { value, include }: BooleanFilterValue): string => {
  const excludeText = !include ? ' (exclude)' : '';
  const valueText = value ? 'True' : 'False';
  return `<b>${property}${excludeText}:</b>${valueText}`;
};
