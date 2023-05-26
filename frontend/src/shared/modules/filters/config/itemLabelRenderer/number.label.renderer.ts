import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';

export const numberItemLabelRenderer = (property: string, { value }: NumberFilterValue): string => `<b>${property}:</b>${value}`;
