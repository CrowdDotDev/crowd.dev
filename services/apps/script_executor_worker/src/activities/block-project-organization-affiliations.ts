import { OrganizationField, findOrgById, pgpQx, updateOrganization } from '@crowd/data-access-layer'
import { changeMemberOrganizationAffiliationOverrides } from '@crowd/data-access-layer/src/member_organization_affiliation_overrides'
import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'
import { IChangeAffiliationOverrideData, IMemberOrganization } from '@crowd/types'

import { svc } from '../main'

export async function fetchProjectMemberOrganizationsToBlock(
  limit: number,
  afterId?: string,
): Promise<Pick<IMemberOrganization, 'memberId' | 'id' | 'organizationId'>[]> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.reader.connection(), svc.log)
    return orgRepo.fetchProjectMemberOrganizationsToBlock(limit, afterId)
  } catch (error) {
    svc.log.error(error, 'Error fetching project member organizations to block!')
    throw error
  }
}

export async function isOrganizationAffiliationBlocked(organizationId: string): Promise<boolean> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())
    const organization = await findOrgById(qx, organizationId, [
      OrganizationField.ID,
      OrganizationField.IS_AFFILIATION_BLOCKED,
    ])

    return organization?.isAffiliationBlocked ?? false
  } catch (error) {
    svc.log.error(error, 'Error checking organization affiliation policy!')
    throw error
  }
}

export async function setOrganizationAffiliationPolicy(
  organizationId,
  allowAffiliation: boolean,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await updateOrganization(qx, organizationId, { isAffiliationBlocked: !allowAffiliation })
  } catch (error) {
    svc.log.error(error, 'Error updating organization!')
    throw error
  }
}

export async function blockMemberOrganizationAffiliation(
  data: IChangeAffiliationOverrideData[],
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    return changeMemberOrganizationAffiliationOverrides(qx, data)
  } catch (error) {
    svc.log.error(error, 'Error blocking organization affiliation!')
    throw error
  }
}

export async function markMemberForAffiliationRecalc(memberIds: string[]): Promise<void> {
  try {
    await svc.redis.sAdd('queue:recalculate:members:affiliation', memberIds)
  } catch (error) {
    svc.log.error(error, 'Error marking member for affiliation recalc!')
    throw error
  }
}

export async function getMembersForAffiliationRecalc(batchSize: number): Promise<string[]> {
  try {
    return svc.redis.sPop('queue:recalculate:members:affiliation', batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting members for affiliation recalc!')
    throw error
  }
}
