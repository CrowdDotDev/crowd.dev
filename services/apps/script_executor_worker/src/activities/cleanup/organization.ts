import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'

import { svc } from '../../main'

export async function getOrganizationsToCleanup(batchSize: number): Promise<string[]> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.reader.connection(), svc.log)
    return orgRepo.getOrganizationsForCleanup(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting organizations for cleanup!')
    throw error
  }
}

export async function deleteOrganization(orgId: string): Promise<void> {
  try {
    const orgRepo = new OrganizationRepository(svc.postgres.writer.connection(), svc.log)
    await orgRepo.cleanupOrganization(orgId)
  } catch (error) {
    svc.log.error(error, 'Error cleaning up organization!')
    throw error
  }
}

export async function queueOrgForAggComputation(orgId: string): Promise<void> {
  try {
    await svc.redis.sAdd('organizationIdsForAggComputation', orgId)
  } catch (error) {
    svc.log.error(error, 'Error adding organization to redis set!')
    throw error
  }
}
