import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

export const multiSelectItemLabelRenderer = (property: string, { value }: MultiSelectFilterValue): string => `<b>${property}:</b>${value.join(',')}`;
