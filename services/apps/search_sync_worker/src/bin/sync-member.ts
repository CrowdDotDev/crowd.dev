import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { MemberRepository } from '@/repo/member.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
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

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new MemberRepository(store, log)

  const data = await repo.getMemberData(memberId)

  if (!data) {
    log.error(`Member ${memberId} not found!`)
    process.exit(1)
  } else {
    await emitter.triggerMemberSync(data.tenantId, memberId)
  }
})
