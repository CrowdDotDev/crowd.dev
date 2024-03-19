import { IncludeEnum } from '@/modules/organization/config/saved-views/settings/types/IncludeEnum';

export default {
  id: 'organization',
  copy: ({
    teamOrganization,
  }: {
    teamOrganization: IncludeEnum;
  }) => {
    if (teamOrganization === 'exclude') {
      return 'Excl. team organizations';
    }

    if (teamOrganization === 'include') {
      return 'Incl. team organizations';
    }

    if (teamOrganization === 'filter') {
      return 'Team organizations only';
    }

    return '';
  },
};
