import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

export const stringItemLabelRenderer = (property: string, { value }: StringFilterValue): string => `<b>${property}:</b> ${value}`;
