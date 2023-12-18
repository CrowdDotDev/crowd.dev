import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IncomingWebhookRepository from '../repo/incomingWebhook.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import {
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'

const batchSize = 500

const tracer = getServiceTracer()
const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)
  const emitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  await emitter.init()

  const repo = new IncomingWebhookRepository(store, log)
  let count = 0

  let results = await repo.getFailedWebhooks(batchSize)
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerWebhookProcessing(result.tenantId, result.platform, result.id)
    }

    await repo.markWebhooksPendingBatch(results.map((r) => r.id))

    count += results.length
    log.info(`Triggered total of ${count} failed webhooks!`)

    results = await repo.getFailedWebhooks(batchSize)
  }
})
