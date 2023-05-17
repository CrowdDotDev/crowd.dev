import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

export const multiSelectApiFilterRenderer = (property: string, { value }: MultiSelectFilterValue): any[] => [
  {
    [property]: value,
  },
];
