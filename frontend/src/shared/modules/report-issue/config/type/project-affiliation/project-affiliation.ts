import { ReportDataTypeConfig } from '@/shared/modules/report-issue/config';
import ProjectAffiliation from './type-project-affiliation.vue';

export const projectAffiliation: ReportDataTypeConfig = {
  description: (attribute: any) => `Project: ${attribute.name}`,
  display: ProjectAffiliation,
};

export default projectAffiliation;
