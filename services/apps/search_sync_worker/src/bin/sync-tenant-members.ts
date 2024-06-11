import { MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG } from '../conf'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getClientSQL } from '@crowd/questdb'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const service = new MemberSyncService(redis, store, qdbStore, openSearchService, log)

  await service.syncTenantMembers(tenantId)

  process.exit(0)
})
