import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';

const noWorkExperience: DataIssueTypeConfig = {
  label: 'No work experience',
  badgeType: 'danger',
  badgeText: () => 'Missing work experiences',
  description: () => 'This profile has no work experience, please review if this is correct.',
};

export default noWorkExperience;
