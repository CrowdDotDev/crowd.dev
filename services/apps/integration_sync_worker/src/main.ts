import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { getOpensearchClient } from '@crowd/opensearch'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, OPENSEARCH_CONFIG, QUEUE_CONFIG, SERVICE_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'

const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration sync worker...')
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const opensearchClient = await getOpensearchClient(OPENSEARCH_CONFIG())

  const worker = new WorkerQueueReceiver(
    SERVICE_CONFIG().queuePriorityLevel,
    queueClient,
    dbConnection,
    opensearchClient,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await worker.start()
  } catch (err) {
    log.error(err, 'Failed to start!')
    process.exit(1)
  }
})
