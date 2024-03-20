import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import { DefaultFiltersSettings } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export const memberDefaultFilterRenderer = ({ teamMember, bot }: DefaultFiltersSettings) => {
  if (teamMember === IncludeEnum.EXCLUDE && bot === IncludeEnum.EXCLUDE) {
    return 'Excl. team and bot contacts';
  }

  if (teamMember === IncludeEnum.EXCLUDE && bot === IncludeEnum.INCLUDE) {
    return 'Incl. bot contacts and excl. team contacts';
  }

  if (teamMember === IncludeEnum.INCLUDE && bot === IncludeEnum.EXCLUDE) {
    return 'Incl. team contacts and excl. bot contacts';
  }

  if (teamMember === IncludeEnum.FILTER) {
    return 'Team contacts only';
  }

  return 'Incl. team and bot contacts';
};
