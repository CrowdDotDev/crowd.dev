import { IInsertableWebhookStream } from '../repo/integrationStream.data'
import IntegrationStreamRepository from '../repo/integrationStream.repo'
import IntegrationStreamService from '../service/integrationStreamService'
import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger } from '@crowd/logging'
import { REDIS_IOC, RedisClient, processWithLock } from '@crowd/redis'
import { APP_IOC } from 'ioc_constants'

export const processOldStreamsJob = async (): Promise<void> => {
  const ioc = IOC()
  const log = ioc.get<Logger>(LOGGING_IOC.logger)
  const store = ioc.get<DbStore>(DATABASE_IOC.store)
  const service = ioc.get<IntegrationStreamService>(APP_IOC.streamService)
  const redis = ioc.get<RedisClient>(REDIS_IOC.client)
  const repo = new IntegrationStreamRepository(store, log)

  const prepareWebhooks = async (): Promise<void> => {
    await processWithLock(redis, 'prepare-webhooks', 5 * 60, 3 * 60, async () => {
      const webhooks = await repo.getOldWebhooksToProcess(5)
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
        await repo.publishWebhookStreams(prepared)
      }
    })
  }

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-streams', 5 * 60, 3 * 60, async () => {
      const streams = await repo.getOldStreamsToProcess(5)
      await repo.touchUpdatedAt(streams)
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
