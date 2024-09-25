import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getOpensearchClient, MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { getRedisClient } from '@crowd/redis'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantId = processArguments[0]

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new MemberSyncService(redis, store, openSearchService, log)

  await service.cleanupMemberIndex(tenantId)

  process.exit(0)
})
