import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

export const dateApiFilterRenderer = (property: string, { value }: DateFilterValue): any[] => [
  {
    [property]: value,
  },
];
