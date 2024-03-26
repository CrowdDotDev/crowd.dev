import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import { DefaultFiltersSettings } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export const memberDefaultFilterRenderer = ({ teamMember, bot }: DefaultFiltersSettings) => {
  if (teamMember === IncludeEnum.EXCLUDE && bot === IncludeEnum.EXCLUDE) {
    return 'Excl. team and bot contributors';
  }

  if (teamMember === IncludeEnum.EXCLUDE && bot === IncludeEnum.INCLUDE) {
    return 'Incl. bot contributors and excl. team contributors';
  }

  if (teamMember === IncludeEnum.INCLUDE && bot === IncludeEnum.EXCLUDE) {
    return 'Incl. team contributors and excl. bot contributors';
  }

  if (teamMember === IncludeEnum.FILTER) {
    return 'Team contributors only';
  }

  return 'Incl. team and bot contributors';
};
