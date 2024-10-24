import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const moreThan10Identities: DataIssueTypeConfig = {
  label: 'More than 10 identities',
  badgeType: 'warning',
  badgeText: () => 'More than 10 identities',
  description: (member: any) => `This profile has ${member.identityCount} identities, please review them if they are all necessary.`,
};

export default moreThan10Identities;
