import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, WORKER_SETTINGS } from './conf'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration stream worker...')

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(queueClient, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(queueClient, log)
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, log)

  const queue = new WorkerQueueReceiver(
    WORKER_SETTINGS().queuePriorityLevel,
    queueClient,
    redisClient,
    dbConnection,
    runWorkerEmiiter,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await runWorkerEmiiter.init()
    await streamWorkerEmitter.init()
    await dataSinkWorkerEmitter.init()

    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
