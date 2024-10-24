import { DataIssueTypeConfig } from '@/modules/data-quality/config/data-issue-types';
import pluralize from 'pluralize';

const incompleteWorkExperience: DataIssueTypeConfig = {
  label: 'Incomplete work experience',
  badgeType: 'warning',
  badgeText: () => 'Incomplete work experiences',
  description: (member: any) => `This profile has ${member.organizationsCount} 
  incomplete work ${pluralize('experience', +member.organizationsCount)}, please review ${+member.organizationsCount > 1 ? 'them' : 'it'}.`,
};

export default incompleteWorkExperience;
