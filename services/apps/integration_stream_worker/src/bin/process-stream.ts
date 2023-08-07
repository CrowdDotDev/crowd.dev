import { DB_CONFIG, SQS_CONFIG } from '@/conf'
import IntegrationStreamRepository from '@/repo/integrationStream.repo'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { IntegrationStreamWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { IntegrationStreamState } from '@crowd/types'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: streamId')
  process.exit(1)
}

const streamIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const emitter = new IntegrationStreamWorkerEmitter(sqsClient, log)
  await emitter.init()

  const dbConnection = getDbConnection(DB_CONFIG(), 1)
  const store = new DbStore(log, dbConnection)
  const repo = new IntegrationStreamRepository(store, log)

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

      if (info.runId) {
        await emitter.triggerStreamProcessing(info.tenantId, info.integrationType, streamId)
      } else if (info.webhookId) {
        await emitter.triggerWebhookProcessing(info.tenantId, info.integrationType, info.webhookId)
      }
    } else {
      log.error({ streamId }, 'Stream not found!')
      process.exit(1)
    }
  }
})
