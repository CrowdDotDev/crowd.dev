import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { MemberRepository } from '@crowd/data-access-layer/src/old/apps/search_sync_worker/member.repo'
import { getServiceLogger } from '@crowd/logging'
import { getOpensearchClient, MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { getRedisClient } from '@crowd/redis'
import { getClientSQL } from '@crowd/questdb'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const osClient = await getOpensearchClient(OPENSEARCH_CONFIG())
  const openSearchService = new OpenSearchService(log, osClient)

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const qdbConn = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConn)

  const repo = new MemberRepository(store, log)
  const service = new MemberSyncService(redis, store, qdbStore, openSearchService, log)

  const results = await repo.checkMembersExist([memberId])

  if (results.length === 0) {
    log.error(`Member ${memberId} not found!`)
    process.exit(1)
  } else {
    log.info(`Member ${memberId} found! Triggering sync!`)
    await service.syncMembers(memberId)
    process.exit(0)
  }
})
