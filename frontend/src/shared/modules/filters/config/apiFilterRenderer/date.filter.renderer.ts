import { DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

export const dateApiFilterRenderer = (property: string, { value, include, operator }: DateFilterValue): any[] => {
  const filter = {
    [operator]: value,
  };

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
