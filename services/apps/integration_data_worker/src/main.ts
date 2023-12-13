import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG, WORKER_SETTINGS } from './conf'
import { getRedisClient } from '@crowd/redis'
import { DbStore, getDbConnection } from '@crowd/database'
import { getSqsClient } from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'
import { processOldDataJob } from './jobs/processOldData'
import {
  IntegrationStreamWorkerEmitter,
  DataSinkWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 3
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  log.info('Starting integration data worker...')

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )

  const queue = new WorkerQueueReceiver(
    WORKER_SETTINGS().queuePriorityLevel,
    sqsClient,
    redisClient,
    dbConnection,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await streamWorkerEmitter.init()
    await dataSinkWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldDataJob(
            dbConnection,
            redisClient,
            streamWorkerEmitter,
            dataSinkWorkerEmitter,
            log,
          )
        }
      } catch (err) {
        log.error(err, 'Failed to process old data!')
      } finally {
        processing = false
      }
    }, PROCESSING_INTERVAL_MINUTES * 60 * 1000)
    await queue.start()
  } catch (err) {
    log.error({ err }, 'Failed to start queues!')
    process.exit(1)
  }
})
