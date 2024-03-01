import { MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SERVICE_CONFIG } from '../conf'
import { MemberRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/member.repo'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { timeout } from '@crowd/common'
import { IndexingRepository } from '@crowd/opensearch/src/repo/indexing.repo'
import { IndexedEntityType } from '@crowd/opensearch/src/repo/indexing.data'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

const MAX_CONCURRENT = 3

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  if (processArguments.includes('--clean')) {
    const indexingRepo = new IndexingRepository(store, log)
    await indexingRepo.deleteIndexedEntities(IndexedEntityType.MEMBER)
  }

  const repo = new MemberRepository(redis, store, log)

  const tenantIds = await repo.getTenantIds()

  const service = new MemberSyncService(redis, store, openSearchService, log, SERVICE_CONFIG())

  let current = 0
  for (let i = 0; i < tenantIds.length; i++) {
    const tenantId = tenantIds[i]

    while (current == MAX_CONCURRENT) {
      await timeout(1000)
    }

    log.info(`Processing tenant ${i + 1}/${tenantIds.length}`)
    current += 1
    service
      .syncTenantMembers(tenantId, 500)
      .then(() => {
        current--
        log.info(`Processed tenant ${i + 1}/${tenantIds.length}`)
      })
      .catch((err) => {
        current--
        log.error(
          err,
          { tenantId },
          `Error syncing members for tenant ${i + 1}/${tenantIds.length}!`,
        )
      })
  }

  while (current > 0) {
    await timeout(1000)
  }

  process.exit(0)
})
