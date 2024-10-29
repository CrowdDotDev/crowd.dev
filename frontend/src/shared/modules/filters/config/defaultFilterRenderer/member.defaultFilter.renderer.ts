import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import { DefaultFiltersSettings } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export const memberDefaultFilterRenderer = ({ teamMember }: DefaultFiltersSettings) => {
  if (teamMember === IncludeEnum.EXCLUDE) {
    return 'Excl. team members';
  }

  if (teamMember === IncludeEnum.INCLUDE) {
    return 'Incl. team members';
  }

  if (teamMember === IncludeEnum.FILTER) {
    return 'Team members only';
  }
  return '';
};
