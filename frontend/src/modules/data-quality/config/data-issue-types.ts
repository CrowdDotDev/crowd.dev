import { DataIssueType } from '@/modules/data-quality/types/DataIssueType';
import noWorkExperience from '@/modules/data-quality/config/types/no-work-experience';
import incompleteWorkExperience from '@/modules/data-quality/config/types/incomplete-work-experience';
import tooManyIdentitiesPerPlatform from '@/modules/data-quality/config/types/too-many-identities-per-platform';
import tooManyEmails from '@/modules/data-quality/config/types/too-many-emails';
import tooManyIdentities from '@/modules/data-quality/config/types/too-many-identities';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { Organization } from '@/modules/organization/types/Organization';

export interface DataIssueTypeConfig{
  label: string;
  badgeType: string;
  badgeText: (entity: Contributor | Organization) => string;
  description: (entity: Contributor | Organization) => string;
}

export const dataIssueTypes: Record<DataIssueType, DataIssueTypeConfig> = {
  [DataIssueType.TOO_MANY_IDENTITIES]: tooManyIdentities,
  [DataIssueType.TOO_MANY_IDENTITIES_PER_PLATFORM]: tooManyIdentitiesPerPlatform,
  [DataIssueType.TOO_MANY_EMAILS]: tooManyEmails,
  [DataIssueType.NO_WORK_EXPERIENCE]: noWorkExperience,
  [DataIssueType.INCOMPLETE_WORK_EXPERIENCE]: incompleteWorkExperience,
};
