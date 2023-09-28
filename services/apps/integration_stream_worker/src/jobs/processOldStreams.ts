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

  while (streamsToProcess.length > 0) {
    log.info(`Detected ${streamsToProcess.length} old streams to process!`)
    for (const streamId of streamsToProcess) {
      try {
        await service.processStream(streamId)
      } catch (err) {
        log.error(err, 'Failed to process stream!')
      }
    }

    streamsToProcess = await loadNextBatch()
  }
}
