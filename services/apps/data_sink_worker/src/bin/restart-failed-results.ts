import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import DataSinkRepository from '../repo/dataSink.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'
import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: runId')
  process.exit(1)
}

const runId = processArguments[0]

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const redis = await getRedisClient(REDIS_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, redis, tracer, unleash, loader, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)

  let results = await repo.getFailedResultsForRun(runId, 1, 20)
  while (results.length > 0) {
    await repo.resetResults(results.map((r) => r.id))

    for (const result of results) {
      await emitter.triggerResultProcessing(
        result.tenantId,
        result.platform,
        result.id,
        result.id,
        result.id,
      )
    }

    results = await repo.getFailedResultsForRun(runId, 1, 20)
  }
})
