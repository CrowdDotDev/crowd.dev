import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { MemberSyncService, OpenSearchService, getOpensearchClient } from '@crowd/opensearch'
import { getClientSQL } from '@crowd/questdb'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const service = new MemberSyncService(redis, store, qdbStore, openSearchService, log)

  await service.cleanupMemberIndex()

  process.exit(0)
})
