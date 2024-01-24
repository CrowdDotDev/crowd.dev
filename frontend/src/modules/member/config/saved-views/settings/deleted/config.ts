import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { includeFilterRenderer } from '@/modules/member/config/saved-views/settings/common/includeFilterRenderer';
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import MemberDeletedSetting from './MemberDeletedSetting.vue';

const deleted: SavedViewsSetting<IncludeEnum> = {
  inSettings: false,
  settingsComponent: MemberDeletedSetting,
  defaultValue: IncludeEnum.EXCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    return includeFilterRenderer('isDeleted', value);
  },
};

export default deleted;
