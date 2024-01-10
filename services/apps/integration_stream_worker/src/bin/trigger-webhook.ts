import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG, UNLEASH_CONFIG } from '../conf'
import IncomingWebhookRepository from '../repo/incomingWebhook.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getSqsClient } from '@crowd/sqs'
import { WebhookState, WebhookType } from '@crowd/types'
import {
  IntegrationStreamWorkerEmitter,
  PriorityLevelContextRepository,
  QueuePriorityContextLoader,
} from '@crowd/common_services'
import { getUnleashClient } from '@crowd/feature-flags'
import { getRedisClient } from '@crowd/redis'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: webhookId')
  process.exit(1)
}

const webhookIds = processArguments[0].split(',')

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const priorityLevelRepo = new PriorityLevelContextRepository(store, log)
  const loader: QueuePriorityContextLoader = (tenantId: string) =>
    priorityLevelRepo.loadPriorityLevelContext(tenantId)

  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(
    sqsClient,
    redisClient,
    tracer,
    unleash,
    loader,
    log,
  )
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
