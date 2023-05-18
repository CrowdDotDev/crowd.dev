import { NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';

export const numberApiFilterRenderer = (property: string, { value }: NumberFilterValue): any[] => [
  {
    [property]: value,
  },
];
