import { IncludeEnum } from '@/modules/member/config/saved-views/settings/common/types/IncludeEnum';
import organization from './organizations';
import member from './members';

type MemberConfig = {
  teamMember?: IncludeEnum;
  bot?: IncludeEnum;
};

type OrganizationConfig = {
  teamOrganization?: IncludeEnum;
};

type CopyConfig = (settings: MemberConfig | OrganizationConfig) => string;

export default {
  member,
  organization,
} as {
  member: {
    id: string;
    copy: CopyConfig;
  };
  organization: {
    id: string;
    copy: CopyConfig;
  };
};
