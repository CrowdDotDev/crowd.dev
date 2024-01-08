import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import DataSinkRepository from '../repo/dataSink.repo'
import { partition } from '@crowd/common'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { ProcessIntegrationResultQueueMessage } from '@crowd/types'
import {
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'

const MAX_TO_PROCESS = 500

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: numResults')
  process.exit(1)
}

let numResults = parseInt(processArguments[0], 10)

numResults = Math.min(numResults, MAX_TO_PROCESS)

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new DataSinkWorkerEmitter(sqsClient, redis, tracer, unleash, loader, log)
  await emitter.init()

  const repo = new DataSinkRepository(store, log)

  const results = await repo.getFailedResults(1, numResults)

  if (results.length === 0) {
    log.info('No results to restart.')
    process.exit(0)
  }

  await repo.resetResults(results.map((r) => r.id))

  const messages = results.map((r) => {
    return {
      tenantId: r.tenantId,
      payload: new ProcessIntegrationResultQueueMessage(r.id),
      groupId: r.id,
      deduplicationId: r.id,
    }
  })

  const batches = partition(messages, 10)
  for (const batch of batches) {
    await emitter.sendMessagesBatch(batch)
  }

  log.info(`Restarted total of ${results.length} failed results.`)
})
