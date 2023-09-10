import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import IncomingWebhookRepository from '@/repo/incomingWebhook.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'

const batchSize = 500

const log = getServiceLogger()

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const repo = new IncomingWebhookRepository(store, log)
  let count = 0

  let results = await repo.getPendingWebhooks(batchSize)
  while (results.length > 0) {
    for (const result of results) {
      await emitter.triggerWebhookProcessing(result.tenantId, result.platform, result.id)
    }

    count += results.length
    log.info(`Triggered total of ${count} failed results.`)

    results = await repo.getPendingWebhooks(batchSize)
  }
})
