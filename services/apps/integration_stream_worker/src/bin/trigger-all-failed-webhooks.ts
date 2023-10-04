import { DATABASE_IOC, DbStore } from '@crowd/database'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, SQS_IOC } from '@crowd/sqs'
import { APP_IOC_MODULE } from 'ioc'
import IncomingWebhookRepository from '../repo/incomingWebhook.repo'

const batchSize = 500

setImmediate(async () => {
  const ioc = await APP_IOC_MODULE(3)

  const log = ioc.get<Logger>(LOGGING_IOC.logger)

  const emitter = ioc.get<IntegrationStreamWorkerEmitter>(SQS_IOC.emitters.integrationStreamWorker)

  const store = ioc.get<DbStore>(DATABASE_IOC.store)

  const repo = new IncomingWebhookRepository(store, log)
  let count = 0

  let results = await repo.getFailedWebhooks(batchSize)
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerWebhookProcessing(result.tenantId, result.platform, result.id)
    }

    await repo.markWebhooksPendingBatch(results.map((r) => r.id))

    count += results.length
    log.info(`Triggered total of ${count} failed webhooks!`)

    results = await repo.getFailedWebhooks(batchSize)
  }
})
