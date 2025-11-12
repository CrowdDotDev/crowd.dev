import OrganizationRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/organization.repo'

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
