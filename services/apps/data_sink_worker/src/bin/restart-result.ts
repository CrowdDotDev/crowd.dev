import { DB_CONFIG, REDIS_CONFIG, UNLEASH_CONFIG, QUEUE_CONFIG } from '../conf'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, redis, tracer, unleash, loader, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)
  for (const resultId of resultIds) {
    const result = await repo.getResultInfo(resultId)
    if (!result) {
      log.error(`Result ${resultId} not found!`)
      process.exit(1)
    } else {
      await repo.resetResults([resultId])
      await emitter.triggerResultProcessing(
        result.tenantId,
        result.platform,
        result.id,
        result.id,
        result.onboarding === null ? true : result.onboarding,
      )
    }
  }
})
