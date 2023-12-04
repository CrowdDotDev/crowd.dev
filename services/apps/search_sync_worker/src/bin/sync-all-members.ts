import { MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SERVICE_CONFIG } from '../conf'
import { MemberRepository } from '../repo/member.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { timeout } from '@crowd/common'

const log = getServiceLogger()

const MAX_CONCURRENT = 3

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

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
