import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';

const workHistory: SavedViewsSetting<IncludeEnum> = {
  inSettings: false,
  defaultValue: IncludeEnum.INCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    if (value === IncludeEnum.EXCLUDE) {
      return [
        {
          organizations: {
            eq: null,
          },
        },
      ];
    }
    return [];
  },
};

export default workHistory;
