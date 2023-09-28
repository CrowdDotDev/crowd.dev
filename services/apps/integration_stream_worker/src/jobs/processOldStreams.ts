import IntegrationStreamRepository from '@/repo/integrationStream.repo'
import IntegrationStreamService from '@/service/integrationStreamService'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient, processWithLock } from '@crowd/redis'
import {
  IntegrationRunWorkerEmitter,
  IntegrationDataWorkerEmitter,
  IntegrationStreamWorkerEmitter,
} from '@crowd/sqs'

export const processOldStreamsJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  runWorkerEmitter: IntegrationRunWorkerEmitter,
  dataWorkerEmitter: IntegrationDataWorkerEmitter,
  streamWorkerEmitter: IntegrationStreamWorkerEmitter,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn)
  const service = new IntegrationStreamService(
    redis,
    runWorkerEmitter,
    dataWorkerEmitter,
    streamWorkerEmitter,
    store,
    log,
  )
  const repo = new IntegrationStreamRepository(store, log)

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-streams', 5 * 60, 3 * 60, async () => {
      const streams = await repo.getOldStreamsToProcess(5)
      await repo.touchUpdatedAt(streams)
      return streams
    })
  }

  // load 5 oldest streams and try process them
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

    streamsToProcess = await loadNextBatch()
  }
}
