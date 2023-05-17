import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

export const selectApiFilterRenderer = (property: string, { value }: SelectFilterValue): any[] => [
  {
    [property]: value,
  },
];
