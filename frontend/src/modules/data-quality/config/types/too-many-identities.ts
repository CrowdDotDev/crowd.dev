import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const tooManyIdentities: DataIssueTypeConfig = {
  label: 'More than 15 identities',
  badgeType: 'warning',
  badgeText: () => 'More than 15 identities',
  description: (member: any) => `This profile has ${member.identityCount} identities, please review them if they are all necessary.`,
};

export default tooManyIdentities;
