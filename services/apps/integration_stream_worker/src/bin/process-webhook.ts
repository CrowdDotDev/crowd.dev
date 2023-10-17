import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  getSqsClient,
} from '@crowd/sqs'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: webhookIds')
  process.exit(1)
}

const webhookIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())

  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(sqsClient, tracer, log)
  const dataWorkerEmitter = new IntegrationDataWorkerEmitter(sqsClient, tracer, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(sqsClient, tracer, log)

  await runWorkerEmiiter.init()
  await dataWorkerEmitter.init()
  await streamWorkerEmitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new IntegrationStreamService(
    redisClient,
    runWorkerEmiiter,
    dataWorkerEmitter,
    streamWorkerEmitter,
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
