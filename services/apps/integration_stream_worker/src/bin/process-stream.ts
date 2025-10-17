import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IntegrationStreamRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { IntegrationStreamState } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'
import IntegrationStreamService from '../service/integrationStreamService'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: streamId')
  process.exit(1)
}

const streamIds = processArguments[0].split(',')

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const runWorkerEmiiter = new IntegrationRunWorkerEmitter(queueClient, log)
  const streamWorkerEmitter = new IntegrationStreamWorkerEmitter(queueClient, log)
  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, log)

  await runWorkerEmiiter.init()
  await streamWorkerEmitter.init()
  await dataSinkWorkerEmitter.init()

  const repo = new IntegrationStreamRepository(store, log)

  const service = new IntegrationStreamService(
    redisClient,
    runWorkerEmiiter,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
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

  process.exit(0)
})
