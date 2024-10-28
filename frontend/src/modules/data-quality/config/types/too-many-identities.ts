import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const tooManyIdentities: DataIssueTypeConfig = {
  label: 'More than 15 identities',
  badgeType: 'danger',
  badgeText: () => 'More than 15 identities',
  description: () => null,
};

export default tooManyIdentities;
