import { ReportDataEntity } from '@/shared/modules/report-issue/constants/report-data-entity.enum';

import person from './entity/person';
import organization from './entity/organization';

import ProfileDetails from './type/type-profile-details.vue';
import ProjectAffiliation from './type/type-project-affiliation.vue';
import WorkExperience from './type/type-work-experience.vue';
import Identity from './type/type-identity.vue';
import OrganizationDetails from './type/type-organization-details.vue';
import Domain from './type/type-domain.vue';

export interface ReportDataConfig {
  url: (id: string) => string;
  types: DataReportTypes[];
}

export const reportDataConfig: Record<ReportDataEntity, ReportDataConfig> = {
  person,
  organization,
};

export const reportDataTypeDisplay: Record<DataReportTypes, any | null> = {
  [DataReportTypes.PROFILE_DETAILS]: ProfileDetails,
  [DataReportTypes.PROJECT]: null,
  [DataReportTypes.PROJECT_AFFILIATION]: ProjectAffiliation,
  [DataReportTypes.WORK_EXPERIENCE]: WorkExperience,
  [DataReportTypes.IDENTITY]: Identity,
  [DataReportTypes.ORGANIZATION_DETAILS]: OrganizationDetails,
  [DataReportTypes.DOMAIN]: Domain,
  [DataReportTypes.OTHER]: null,
};
