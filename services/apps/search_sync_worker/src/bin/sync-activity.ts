import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import { ActivityRepository } from '@/repo/activity.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: activityId')
  process.exit(1)
}

const activityId = processArguments[0]

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new SearchSyncWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new ActivityRepository(store, log)

  const results = await repo.getActivityData([activityId])

  if (results.length === 0) {
    log.error(`Activity ${activityId} not found!`)
    process.exit(1)
  } else {
    log.info(`Activity ${activityId} found! Triggering sync!`)
    await emitter.triggerActivitySync(results[0].tenantId, activityId)
    process.exit(0)
  }
})
