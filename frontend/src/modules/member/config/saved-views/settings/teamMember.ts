import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { includeFilterRenderer } from '@/modules/member/config/saved-views/settings/common/includeFilterRenderer';
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/types/IncludeEnum';

const teamMember: SavedViewsSetting<IncludeEnum> = {
  defaultValue: IncludeEnum.EXCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    return includeFilterRenderer('isTeamMember', value);
  },
};

export default teamMember;
