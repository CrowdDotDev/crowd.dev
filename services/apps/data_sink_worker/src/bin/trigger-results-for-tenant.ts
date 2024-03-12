import { generateUUIDv1 } from '@crowd/common'
import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getUnleashClient } from '@crowd/feature-flags'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getSqsClient } from '@crowd/sqs'
import { getServiceTracer } from '@crowd/tracing'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: tenantId')
  process.exit(1)
}

const tenantIds = processArguments[0].split(',')

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
    sqsClient,
    redis,
    tracer,
    unleash,
    loader,
    log,
  )
  await dataSinkWorkerEmitter.init()

  const repo = new DataSinkRepository(store, log)
  for (const tenantId of tenantIds) {
    let resultIds = await repo.getOldResultsToProcessForTenant(tenantId, 100)

    while (resultIds.length > 0) {
      const resultId = resultIds.shift()

      await dataSinkWorkerEmitter.triggerResultProcessing(
        tenantId,
        'unknown',
        resultId,
        generateUUIDv1(),
        true,
      )

      if (resultIds.length === 0) {
        resultIds = await repo.getOldResultsToProcessForTenant(tenantId, 100, resultId)
      }
    }
  }

  process.exit(0)
})
