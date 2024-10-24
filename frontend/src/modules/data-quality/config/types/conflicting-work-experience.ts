import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const conflictingWorkExperience: DataIssueTypeConfig = {
  label: 'Conflicting work experience',
  badgeType: 'danger',
  badgeText: () => 'Conflicting work experiences',
  description: () => 'This profile has Conflicting work experiences, please review them.',
};

export default conflictingWorkExperience;
