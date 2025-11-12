import { refreshMemberOrganizationAffiliations } from '@crowd/data-access-layer/src/member-organization-affiliation'
import { deleteMemberOrganizations } from '@crowd/data-access-layer/src/members'
import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'

import { svc } from '../main'

export async function pruneOrganization(orgId: string): Promise<void> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.writer.connection(), svc.log)
    await orgRepo.pruneOrganization(orgId)
  } catch (error) {
    svc.log.error(error, 'Error pruning organization in database!')
    throw error
  }
}

export async function getOrganizationsToPrune(
  batchSize: number,
): Promise<{ id: string; displayName: string }[]> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.reader.connection(), svc.log)
    return orgRepo.getOrganizationsToPrune(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting organizations to prune!')
    throw error
  }
}

export async function getMemberOrganizationsToPrune(
  batchSize: number,
): Promise<{ id: string; memberId: string }[]> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.reader.connection(), svc.log)
    return orgRepo.getMemberOrganizationsToPrune(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting member organizations to prune!')
    throw error
  }
}

export async function pruneMemberOrganization(
  memberOrganizationId: string,
  memberId: string,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await deleteMemberOrganizations(qx, memberId, [memberOrganizationId], false)
  } catch (error) {
    svc.log.error(error, 'Error pruning member organization!')
    throw error
  }
}

export async function refreshMemberAffiliations(memberId: string): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await refreshMemberOrganizationAffiliations(qx, memberId)
  } catch (error) {
    svc.log.error(error, 'Error refreshing member affiliations!')
    throw error
  }
}
