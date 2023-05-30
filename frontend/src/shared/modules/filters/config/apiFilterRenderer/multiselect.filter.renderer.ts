import { MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

export const multiSelectApiFilterRenderer = (property: string, { value, include }: MultiSelectFilterValue): any[] => {
  const filter = { contains: value };

  return [
    {
      [property]: (include ? filter : {
        not: {
          filter,
        },
      }),
    },
  ];
};
