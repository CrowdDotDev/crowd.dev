import { StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

export const stringApiFilterRenderer = (property: string, { value }: StringFilterValue): any[] => [
  {
    [property]: value,
  },
];
