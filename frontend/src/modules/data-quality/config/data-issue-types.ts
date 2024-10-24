import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';
import noWorkExperience from '@/modules/data-quality/config/types/no-work-experience';
import moreThan1IdentityPerPlatform from '@/modules/data-quality/config/types/more-than-1-identity-per-platform';
import moreThan10Identities from '@/modules/data-quality/config/types/more-than-10-identities';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { Organization } from '@/modules/organization/types/Organization';

export interface DataIssueTypeConfig{
  label: string;
  badgeType: string;
  badgeText: (entity: Contributor | Organization) => string;
  description: (entity: Contributor | Organization) => string;
}

export const dataIssueTypes: Record<DataIssueType, DataIssueTypeConfig> = {
  [DataIssueType.MORE_THAN_10_IDENTITIES]: moreThan10Identities,
  [DataIssueType.MORE_THAN_1_IDENTITY_PER_PLATFORM]: moreThan1IdentityPerPlatform,
  [DataIssueType.NO_WORK_EXPERIENCE]: noWorkExperience,
};
