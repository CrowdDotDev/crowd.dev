import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';

export default {
  id: 'member',
  copy: ({
    teamMember,
    bot,
  }: {
    teamMember: IncludeEnum;
    bot: IncludeEnum;
  }) => {
    if (teamMember === 'exclude' && bot === 'exclude') {
      return 'Excl. team and bot contributors';
    }

    if (teamMember === 'exclude' && bot === 'include') {
      return 'Incl. bot contributors and excl. team contributors';
    }

    if (teamMember === 'include' && bot === 'exclude') {
      return 'Incl. team contributors and excl. bot contributors';
    }

    if (teamMember === 'filter') {
      return 'Team contributors only';
    }

    return 'Incl. team and bot contributors';
  },
};
