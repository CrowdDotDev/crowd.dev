import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const tooManyEmails: DataIssueTypeConfig = {
  label: 'More than 3 verified emails',
  badgeType: 'warning',
  badgeText: () => 'More than 3 verified emails',
  description: (member: any) => `This profile has ${member.identityCount} verified emails, please review them if they are all necessary.`,
};

export default tooManyEmails;
