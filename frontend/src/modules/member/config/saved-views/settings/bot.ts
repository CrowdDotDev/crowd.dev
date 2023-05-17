import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/types/IncludeEnum';
import { includeFilterRenderer } from '@/modules/member/config/saved-views/settings/common/includeFilterRenderer';

const bot: SavedViewsSetting<IncludeEnum> = {
  defaultValue: IncludeEnum.EXCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    return includeFilterRenderer('isBot', value);
  },
};

export default bot;
