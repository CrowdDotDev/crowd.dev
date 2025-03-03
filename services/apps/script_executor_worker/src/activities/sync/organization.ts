import { sumBy } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { OrganizationSyncService } from '@crowd/opensearch'
import { OrganizationRepository } from '@crowd/opensearch/src/repo/organization.repo'

import { svc } from '../../main'

export async function getOrganizationsForSync(batchSize: number): Promise<string[]> {
  try {
    const organizationRepo = new OrganizationRepository(svc.postgres.reader, svc.log)
    return organizationRepo.getOrganizationsForSync(batchSize)
  } catch (error) {
    svc.log.error(error, 'Error getting organizations for sync')
    throw error
  }
}

// todo: support organization sync by segment
// export async function getSegmentOrganizations(segmentId: string): Promise<string[]> {
//   const organizationRepo = new OrganizationRepository(svc.postgres.reader, svc.log)
//   return organizationRepo.getSegmentOrganizations(segmentId)
// }

export async function syncOrganizationsBatch(
  organizationIds: string[],
  withAggs: boolean,
  chunkSize?: number,
): Promise<{ docCount: number; organizationCount: number }> {
  try {
    const service = new OrganizationSyncService(
      new DbStore(svc.log, svc.questdbSQL),
      svc.postgres.writer,
      svc.opensearch,
      svc.log,
    )

    const CHUNK_SIZE = chunkSize || 10

    svc.log.info(`Syncing orgs in chunks of ${CHUNK_SIZE}!`)

    const results = []
    for (let i = 0; i < organizationIds.length; i += CHUNK_SIZE) {
      const chunk = organizationIds.slice(i, i + CHUNK_SIZE)
      const chunkResults = await Promise.all(
        chunk.map((organizationId) => service.syncOrganizations([organizationId], { withAggs })),
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
