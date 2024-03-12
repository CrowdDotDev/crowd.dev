import { generateUUIDv1, partition } from '@crowd/common'
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
import { DataSinkWorkerQueueMessageType } from '@crowd/types'

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
  let count = 0
  const batchSize = 2000
  for (const tenantId of tenantIds) {
    let resultIds = await repo.getOldResultsToProcessForTenant(tenantId, batchSize)

    while (resultIds.length > 0) {
      const lastResultId = resultIds[resultIds.length - 1]
      const batches = partition(resultIds, 10)

      const promises = batches.map((batch) => {
        const messages = batch.map((resultId) => {
          return {
            tenantId,
            payload: {
              type: DataSinkWorkerQueueMessageType.PROCESS_INTEGRATION_RESULT,
              resultId,
            },
            groupId: generateUUIDv1(),
            deduplicationId: resultId,
          }
        })
        const promise = dataSinkWorkerEmitter.sendMessages(messages).then(() => {
          count += messages.length
        })

        return promise
      })

      await Promise.all(promises)
      log.info(`Processed ${count} results!`)

      resultIds = await repo.getOldResultsToProcessForTenant(tenantId, batchSize, lastResultId)
    }
  }

  process.exit(0)
})
