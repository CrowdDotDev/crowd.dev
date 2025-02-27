import { IntegrationStreamWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import IncomingWebhookRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/incomingWebhook.repo'
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'

import { DB_CONFIG, QUEUE_CONFIG } from '../conf'

const batchSize = 500

const log = getServiceLogger()

setImmediate(async () => {
  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const emitter = new IntegrationStreamWorkerEmitter(queueClient, log)
  await emitter.init()

  const repo = new IncomingWebhookRepository(store, log)
  let count = 0

  let results = await repo.getFailedWebhooks(batchSize)
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerWebhookProcessing(result.platform, result.id)
    }

    await repo.markWebhooksPendingBatch(results.map((r) => r.id))

    count += results.length
    log.info(`Triggered total of ${count} failed webhooks!`)

    results = await repo.getFailedWebhooks(batchSize)
  }
})
