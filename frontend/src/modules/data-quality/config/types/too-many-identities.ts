import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const tooManyIdentities: DataIssueTypeConfig = {
  label: 'More than 20 identities',
  badgeType: 'danger',
  badgeText: () => 'More than 20 identities',
  description: () => null,
};

export default tooManyIdentities;
