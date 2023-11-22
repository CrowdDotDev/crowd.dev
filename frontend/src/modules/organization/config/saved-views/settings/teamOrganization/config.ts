import { SavedViewsSetting } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { includeFilterRenderer } from '@/modules/member/config/saved-views/settings/common/includeFilterRenderer';
import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import OrganizationTeamOrganizationSetting from './OrganizationTeamOrganizationSetting.vue';

const config: SavedViewsSetting<IncludeEnum> = {
  inSettings: true,
  settingsComponent: OrganizationTeamOrganizationSetting,
  defaultValue: IncludeEnum.EXCLUDE,
  queryUrlParser(value: string): IncludeEnum {
    return value as IncludeEnum;
  },
  apiFilterRenderer(value: IncludeEnum): any[] {
    return includeFilterRenderer('isTeamOrganization', value);
  },
};

export default config;
