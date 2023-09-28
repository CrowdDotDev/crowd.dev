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
  const repo = new IntegrationStreamRepository(store, log)

  // load 5 oldest streams and try process them
  const streamsToProcess = await processWithLock(
    redis,
    'process-old-streams',
    5 * 60,
    3 * 60,
    async () => {
      const streams = await repo.getOldStreamsToProcess(5)
      await repo.touchUpdatedAt(streams)
      return streams
    },
  )

  if (streamsToProcess.length > 0) {
    log.info(`Detected ${streamsToProcess.length} old streams to process!`)
    const service = new IntegrationStreamService(
      redis,
      runWorkerEmitter,
      dataWorkerEmitter,
      streamWorkerEmitter,
      store,
      log,
    )

    for (const streamId of streamsToProcess) {
      await service.processStream(streamId)
    }
  } else {
    log.info('No old streams to process!')
  }
}
