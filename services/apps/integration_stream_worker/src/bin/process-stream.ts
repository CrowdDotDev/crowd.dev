import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IntegrationStreamRepository from '../repo/integrationStream.repo'
import IntegrationStreamService from '../service/integrationStreamService'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { getSqsClient } from '@crowd/sqs'
import { IntegrationStreamState } from '@crowd/types'
import {
  IntegrationDataWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: streamId')
  process.exit(1)
}

const streamIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
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

  await runWorkerEmiiter.init()
  await dataWorkerEmitter.init()
  await streamWorkerEmitter.init()

  const repo = new IntegrationStreamRepository(store, log)

  const service = new IntegrationStreamService(
    redisClient,
    runWorkerEmiiter,
    dataWorkerEmitter,
    streamWorkerEmitter,
    store,
    log,
  )
  for (const streamId of streamIds) {
    const info = await repo.getStreamData(streamId)

    if (info) {
      if (info.state !== IntegrationStreamState.PENDING) {
        await repo.resetStream(streamId)
      }

      if (info.runId && info.webhookId) {
        log.error({ streamId }, 'Stream has both runId and webhookId!')
        process.exit(1)
      }

      if (!info.runId && !info.webhookId) {
        log.error({ streamId }, 'Stream has neither runId nor webhookId!')
        process.exit(1)
      }

      try {
        if (info.runId) {
          await service.processStream(streamId)
        } else if (info.webhookId) {
          await service.processWebhookStream(info.webhookId)
        } else {
          log.error({ streamId }, 'Stream has neither runId nor webhookId!')
          process.exit(1)
        }
      } catch (err) {
        log.error(err, { streamId }, 'Error processing stream!')
      }
    } else {
      log.error({ streamId }, 'Stream not found!')
      process.exit(1)
    }
  }
})
