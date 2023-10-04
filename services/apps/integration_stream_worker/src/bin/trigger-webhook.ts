import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { WebhookState, WebhookType } from '@crowd/types'
import { APP_IOC_MODULE } from 'ioc'
import IncomingWebhookRepository from '../repo/incomingWebhook.repo'

setImmediate(async () => {
  await APP_IOC_MODULE(3)
  const ioc = IOC()

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const processArguments = process.argv.slice(2)

  if (processArguments.length !== 1) {
    log.error('Expected 1 argument: webhookId')
    process.exit(1)
  }

  const webhookIds = processArguments[0].split(',')

  const emitter = ioc.get<IntegrationStreamWorkerEmitter>(SQS_IOC.emitters.integrationStreamWorker)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)
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
