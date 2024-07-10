import { DbStore } from '@crowd/data-access-layer/src/database'
import { svc } from '../../main'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { OrganizationSyncService } from '@crowd/opensearch'

export async function getOrgIdsFromRedis(): Promise<string[]> {
  return await svc.redis.sMembers('organizationIdsForAggComputation')
}

export async function dropOrgIdFromRedis(orgId: string): Promise<void> {
  await svc.redis.sRem('organizationIdsForAggComputation', orgId)
}

export async function checkOrganizationExists(orgId: string): Promise<boolean> {
  let exists = false

  try {
    const repo = new OrganizationRepository(svc.postgres.writer, svc.log)
    const results = await repo.checkOrganizationsExists([orgId])
    exists = results.length > 0
  } catch (e) {
    this.log.error(e, 'Failed to check if organization exists!')
  }

  return exists
}

export async function syncOrganization(orgId: string): Promise<void> {
  const service = new OrganizationSyncService(
    new DbStore(svc.log, svc.questdbSQL),
    svc.postgres.writer,
    svc.opensearch,
    svc.log,
  )

  await service.syncOrganizations([orgId])
}
