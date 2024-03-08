import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { IInsertableWebhookStream } from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.data'
import IntegrationStreamRepository from '@crowd/data-access-layer/src/old/apps/integration_stream_worker/integrationStream.repo'
import IntegrationStreamService from '../service/integrationStreamService'
import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/common_services'

export const processOldStreamsJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  runWorkerEmitter: IntegrationRunWorkerEmitter,
  streamWorkerEmitter: IntegrationStreamWorkerEmitter,
  dataSinkWorkerEmitter: DataSinkWorkerEmitter,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn)
  const service = new IntegrationStreamService(
    redis,
    runWorkerEmitter,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    store,
    log,
  )
  const repo = new IntegrationStreamRepository(store, log)

  const prepareWebhooks = async (): Promise<void> => {
    await repo.transactionally(async (txRepo) => {
      const webhooks = await txRepo.getOldWebhooksToProcess(5)
      const prepared: IInsertableWebhookStream[] = webhooks.map((w) => {
        return {
          identifier: w.id,
          webhookId: w.id,
          data: w.payload,
          integrationId: w.integrationId,
          tenantId: w.tenantId,
        }
      })

      if (prepared.length > 0) {
        await txRepo.publishWebhookStreams(prepared)
      }
    })
  }

  const loadNextBatch = async (): Promise<string[]> => {
    return await repo.transactionally(async (txRepo) => {
      const streams = await txRepo.getOldStreamsToProcess(5)
      await txRepo.touchUpdatedAt(streams)
      return streams
    })
  }

  // load 5 oldest streams and try process them
  await prepareWebhooks()
  let streamsToProcess = await loadNextBatch()

  let successCount = 0
  let errorCount = 0

  while (streamsToProcess.length > 0) {
    for (const streamId of streamsToProcess) {
      try {
        const result = await service.processStream(streamId)

        if (result) {
          successCount++
        } else {
          errorCount++
        }
      } catch (err) {
        log.error(err, 'Failed to process stream!')
        errorCount++
      }
    }

    log.info(`Processed ${successCount} old streams successfully and ${errorCount} with errors.`)

    await prepareWebhooks()
    streamsToProcess = await loadNextBatch()
  }
}
