import { BooleanFilterValue } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';

export const booleanApiFilterRenderer = (property: string, { value, include }: BooleanFilterValue): any[] => [
  (include ? {
    [property]: { eq: value },
  } : {
    [property]: { not: { eq: value } },
  }),
];
