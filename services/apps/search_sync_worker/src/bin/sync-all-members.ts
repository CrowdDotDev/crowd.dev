import { DB_CONFIG, REDIS_CONFIG } from '@/conf'
import { MemberRepository } from '@/repo/member.repo'
import { OpenSearchService } from '@/service/opensearch.service'
import { MemberSyncService } from '@/service/member.sync.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'

const log = getServiceLogger()

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log)
  await openSearchService.initialize()

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new MemberRepository(redis, store, log)

  const tenantIds = await repo.getTenantIds()

  const service = new MemberSyncService(redis, store, openSearchService, log)

  for (const tenantId of tenantIds) {
    await service.syncTenantMembers(tenantId, 500)
  }
  process.exit(0)
})
