import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

export const booleanApiFilterRenderer = (property: string, { value }: BooleanFilterValue): any[] => [
  {
    [property]: { eq: value },
  },
];
