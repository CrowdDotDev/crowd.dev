import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/organization.repo'
import { OrganizationSyncService } from '@crowd/opensearch'

import { svc } from '../../main'

interface IScanResult {
  organizationIds: string[]
  totalSize: number
}

export async function getOrganizationIdsFromRedis(batchSize = 100): Promise<IScanResult> {
  try {
    const totalSize = await svc.redis.sCard('organizationIdsForAggComputation')
    const organizationIds = await svc.redis.sendCommand<string[]>([
      'SRANDMEMBER',
      'organizationIdsForAggComputation',
      batchSize.toString(),
    ])

    return { organizationIds, totalSize }
  } catch (e) {
    svc.log.error(e, 'Failed to get organization IDs from Redis!')
    throw e
  }
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
    svc.log.error(e, 'Failed to check if organization exists!')
  }

  return exists
}

export async function syncOrganization(orgId: string): Promise<void> {
  const service = new OrganizationSyncService(svc.postgres.writer, svc.opensearch, svc.log)

  await service.syncOrganizations([orgId])
}
