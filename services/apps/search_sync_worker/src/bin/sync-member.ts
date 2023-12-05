import { MemberSyncService, OpenSearchService } from '@crowd/opensearch'
import { DB_CONFIG, OPENSEARCH_CONFIG, REDIS_CONFIG, SERVICE_CONFIG } from '../conf'
import { MemberRepository } from '../repo/member.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const openSearchService = new OpenSearchService(log, OPENSEARCH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new MemberRepository(redis, store, log)
  const service = new MemberSyncService(redis, store, openSearchService, log, SERVICE_CONFIG())

  const results = await repo.checkMembersExist([memberId])

  if (results.length === 0) {
    log.error(`Member ${memberId} not found!`)
    process.exit(1)
  } else {
    log.info(`Member ${memberId} found! Triggering sync!`)
    await service.syncMembers([memberId])
    process.exit(0)
  }
})
