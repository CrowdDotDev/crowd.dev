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
      return 'Excl. team and bot contacts';
    }

    if (teamMember === 'exclude' && bot === 'include') {
      return 'Incl. bot contacts and excl. team contacts';
    }

    if (teamMember === 'include' && bot === 'exclude') {
      return 'Incl. team contacts and excl. bot contacts';
    }

    if (teamMember === 'filter') {
      return 'Team contacts only';
    }

    return 'Incl. team and bot contacts';
  },
};
