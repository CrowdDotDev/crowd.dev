import { ReportDataEntity } from '@/shared/modules/report-issue/constants/report-data-entity.enum';

import { ReportDataType } from '@/shared/modules/report-issue/constants/report-data-type.enum';
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
  types: ReportDataType[];
}

export const reportDataConfig: Record<ReportDataEntity, ReportDataConfig> = {
  person,
  organization,
};

export const reportDataTypeDisplay: Record<ReportDataType, any | null> = {
  [ReportDataType.PROFILE_DETAILS]: ProfileDetails,
  [ReportDataType.PROJECT]: null,
  [ReportDataType.PROJECT_AFFILIATION]: ProjectAffiliation,
  [ReportDataType.WORK_EXPERIENCE]: WorkExperience,
  [ReportDataType.IDENTITY]: Identity,
  [ReportDataType.ORGANIZATION_DETAILS]: OrganizationDetails,
  [ReportDataType.DOMAIN]: Domain,
  [ReportDataType.OTHER]: null,
};
