import { sumBy } from '@crowd/common'
import { OrganizationSyncService } from '@crowd/opensearch'
import { OrganizationRepository } from '@crowd/opensearch/src/repo/organization.repo'

import { svc } from '../../main'

export async function getOrganizationsForSync(
  batchSize: number,
  segmentIds?: string[],
): Promise<string[]> {
  try {
    const organizationRepo = new OrganizationRepository(svc.postgres.reader, svc.log)
    return organizationRepo.getOrganizationsForSync(batchSize, null, segmentIds)
  } catch (error) {
    svc.log.error(error, 'Error getting organizations for sync')
    throw error
  }
}

export async function syncOrganizationsBatch(
  organizationIds: string[],
  chunkSize?: number,
): Promise<{ docCount: number; organizationCount: number }> {
  try {
    const service = new OrganizationSyncService(svc.postgres.writer, svc.opensearch, svc.log)

    const CHUNK_SIZE = chunkSize || 10

    svc.log.info(`Syncing orgs in chunks of ${CHUNK_SIZE}!`)

    const results = []
    for (let i = 0; i < organizationIds.length; i += CHUNK_SIZE) {
      const chunk = organizationIds.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map((organizationId) => service.syncOrganizations([organizationId])),
      )
      results.push(...chunkResults)
    }

    return {
      docCount: sumBy(results, (r) => r.documentsIndexed),
      organizationCount: sumBy(results, (r) => r.organizationsSynced),
    }
  } catch (err) {
    throw new Error(err)
  }
}
