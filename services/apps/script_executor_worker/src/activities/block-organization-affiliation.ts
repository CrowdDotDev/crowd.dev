import { pgpQx } from '@crowd/data-access-layer'
import { changeOverride } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'
import { IMemberOrganization } from '@crowd/types'

import { svc } from '../main'

export async function getOrganizationMembers(
  organizationId: string,
  limit = 100,
  offset = 0,
): Promise<IMemberOrganization[]> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.reader.connection(), svc.log)
    return orgRepo.findOrganizationMembers(organizationId, limit, offset)
  } catch (error) {
    svc.log.error(error, 'Error getting organization members!')
    throw error
  }
}

export async function blockMemberOrganizationAffiliation(
  memberId: string,
  memberOrganizationId: string,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    return changeOverride(qx, {
      memberId,
      memberOrganizationId,
      allowAffiliation: false,
      isPrimaryWorkExperience: false,
    })
  } catch (error) {
    svc.log.error(error, 'Error blocking organization affiliation!')
    throw error
  }
}
