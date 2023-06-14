import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { includeFilterRenderer } from '@/modules/organization/config/saved-views/settings/common/includeFilterRenderer';
import { IncludeEnum } from '@/modules/organization/config/saved-views/settings/types/IncludeEnum';

const teamOrganization: SavedViewsSetting<IncludeEnum> = {
  defaultValue: IncludeEnum.EXCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    return includeFilterRenderer('isTeamOrganization', value);
  },
};

export default teamOrganization;
