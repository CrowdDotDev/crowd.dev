import {
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IncomingWebhookRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/incomingWebhook.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { WebhookState, WebhookType } from '@crowd/types'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG } from '../conf'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: webhookId')
  process.exit(1)
}

const webhookIds = processArguments[0].split(',')

setImmediate(async () => {
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(queueClient, redisClient, loader, log)
  await emitter.init()

  const repo = new IncomingWebhookRepository(store, log)

  for (const webhookId of webhookIds) {
    const info = await repo.getWebhookById(webhookId)

    if (info) {
      log.info({ webhookId }, 'Found webhook!')

      if (![WebhookType.GITHUB, WebhookType.GROUPSIO, WebhookType.DISCORD].includes(info.type)) {
        log.error({ webhookId }, 'Webhook is not a supported type!')
        process.exit(1)
      }

      if (info.state !== WebhookState.PENDING) {
        log.info({ webhookId }, 'Webhook is not pending, resetting...')
        await repo.markWebhookPending(webhookId)
      }

      log.info({ webhookId }, 'Triggering webhook processing...')
      await emitter.triggerWebhookProcessing(info.tenantId, info.platform, info.id)
      log.info({ webhookId }, 'Triggered webhook processing!')
    } else {
      log.error({ webhookId }, 'Webhook not found!')
      process.exit(1)
    }
  }
})
