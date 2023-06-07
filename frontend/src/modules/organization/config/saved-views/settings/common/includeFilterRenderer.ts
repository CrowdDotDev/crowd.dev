import { IncludeEnum } from '@/modules/member/config/saved-views/settings/types/IncludeEnum';

export const includeFilterRenderer = (property: string, value: IncludeEnum) => {
  if (value === IncludeEnum.FILTER) {
    return [
      {
        [property]: { eq: true },
      },
    ];
  }
  if (value === IncludeEnum.EXCLUDE) {
    return [
      { [property]: { not: true } },
    ];
  }
  return [];
};
