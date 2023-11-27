import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, WORKER_SETTINGS } from './conf'
import { getRedisClient } from '@crowd/redis'
import { DbStore, getDbConnection } from '@crowd/database'
import { getSqsClient } from '@crowd/sqs'
import { WorkerQueueReceiver } from './queue'
import { processOldStreamsJob } from './jobs/processOldStreams'
import {
  IntegrationRunWorkerEmitter,
  IntegrationDataWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'

const tracer = getServiceTracer()
const log = getServiceLogger()

const MAX_CONCURRENT_PROCESSING = 2
const PROCESSING_INTERVAL_MINUTES = 5

setImmediate(async () => {
  log.info('Starting integration stream worker...')

  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  const sqsClient = getSqsClient(SQS_CONFIG())

  const dbConnection = await getDbConnection(DB_CONFIG(), MAX_CONCURRENT_PROCESSING)
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const priorityLevelRepo = new PriorityLevelContextRepository(new DbStore(log, dbConnection), log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
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
    runWorkerEmiiter,
    dataWorkerEmitter,
    streamWorkerEmitter,
    tracer,
    log,
    MAX_CONCURRENT_PROCESSING,
  )

  try {
    await runWorkerEmiiter.init()
    await dataWorkerEmitter.init()
    await streamWorkerEmitter.init()

    let processing = false
    setInterval(async () => {
      try {
        if (!processing) {
          processing = true
          await processOldStreamsJob(
            dbConnection,
            redisClient,
            runWorkerEmiiter,
            dataWorkerEmitter,
            streamWorkerEmitter,
            log,
          )
        }
      } catch (err) {
        log.error(err, 'Failed to process old streams/webhooks!')
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
function UNLEASH_CONFIG(): import('@crowd/feature-flags').IUnleashConfig {
  throw new Error('Function not implemented.')
}
