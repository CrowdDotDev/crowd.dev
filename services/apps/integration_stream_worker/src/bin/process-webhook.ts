import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import IncomingWebhookRepository from '@/repo/incomingWebhook.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { WebhookState, WebhookType } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: webhookId')
  process.exit(1)
}

const webhookIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)
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
