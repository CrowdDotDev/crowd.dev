import { DB_CONFIG, REDIS_CONFIG, QUEUE_CONFIG, UNLEASH_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { QueueFactory } from '@crowd/queue'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: webhookIds')
  process.exit(1)
}

const webhookIds = processArguments[0].split(',')

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
    queueClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )

  await runWorkerEmiiter.init()
  await streamWorkerEmitter.init()
  await dataSinkWorkerEmitter.init()

  const service = new IntegrationStreamService(
    redisClient,
    runWorkerEmiiter,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    store,
    log,
  )

  for (const webhookId of webhookIds) {
    try {
      await service.processWebhookStream(webhookId)
    } catch (err) {
      log.error({ webhookId, err }, 'Failed to process webhook stream!')
    }
  }

  process.exit(0)
})
