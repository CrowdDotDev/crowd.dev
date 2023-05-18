import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

export const booleanItemLabelRenderer = (property: string, { value }: BooleanFilterValue): string => {
  console.log(value);
  return `<b>${property}:</b> ${value ? 'True' : 'False'}`;
};
