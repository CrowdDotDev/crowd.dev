import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from '@/conf'
import { MemberRepository } from '@/repo/member.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

const processArguments = process.argv.slice(3)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new SearchSyncWorkerEmitter(sqsClient, log)
  await emitter.init()

  const redis = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new MemberRepository(redis, store, log)

  const results = await repo.getMemberData([memberId])

  if (results.length === 0) {
    log.error(`Member ${memberId} not found!`)
    process.exit(1)
  } else {
    log.info(`Member ${memberId} found! Triggering sync!`)
    await emitter.triggerMemberSync(results[0].tenantId, memberId)
    process.exit(0)
  }
})
