import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import WorkExperience from './type-work-experience.vue';

const { displayName } = useOrganizationHelpers();

export const workExperience: ReportDataTypeConfig = {
  description: (attribute: Organization) => `Work experience: ${displayName(attribute)}`,
  display: WorkExperience,
};

export default workExperience;
