import { getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { DB_CONFIG, OPENSEARCH_CONFIG, SERVICE_CONFIG, SQS_CONFIG } from './conf'
import { WorkerQueueReceiver } from './queue'
import { getOpensearchClient } from '@crowd/opensearch'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2

setImmediate(async () => {
  log.info('Starting integration sync worker...')
  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)

  const opensearchClient = getOpensearchClient(OPENSEARCH_CONFIG())

  const worker = new WorkerQueueReceiver(
    SERVICE_CONFIG().queuePriorityLevel,
    sqsClient,
    dbConnection,
    opensearchClient,
    tracer,
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
