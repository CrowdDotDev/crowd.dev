import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

export const dateItemLabelRenderer = (property: string, { value }: DateFilterValue): string => `<b>${property}:</b>${value}`;
