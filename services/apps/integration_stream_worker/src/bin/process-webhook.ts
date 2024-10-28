import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'

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
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(queueClient, redisClient, loader, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    queueClient,
    redisClient,
    loader,
    log,
  )
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, redisClient, loader, log)

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
