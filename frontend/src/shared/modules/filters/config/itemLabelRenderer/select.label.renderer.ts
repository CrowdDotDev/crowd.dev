import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

export const selectItemLabelRenderer = (property: string, { value }: SelectFilterValue): string => `<b>${property}:</b> ${value}`;
