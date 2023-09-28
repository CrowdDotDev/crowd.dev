import IntegrationDataRepository from '@/repo/integrationData.repo'
import IntegrationDataService from '@/service/integrationDataService'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient, processWithLock } from '@crowd/redis'
import { IntegrationStreamWorkerEmitter, DataSinkWorkerEmitter } from '@crowd/sqs'

export const processOldDataJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  streamWorkerEmitter: IntegrationStreamWorkerEmitter,
  dataSinkWorkerEmitter: DataSinkWorkerEmitter,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn)
  const repo = new IntegrationDataRepository(store, log)

  // load 5 oldest streams and try process them
  const dataToProcess = await processWithLock(
    redis,
    'process-old-data',
    5 * 60,
    3 * 60,
    async () => {
      const dataIds = await repo.getOldDataToProcess(5)
      await repo.touchUpdatedAt(dataIds)
      return dataIds
    },
  )

  if (dataToProcess.length > 0) {
    log.info(`Detected ${dataToProcess.length} old data rows to process!`)
    const service = new IntegrationDataService(
      redis,
      streamWorkerEmitter,
      dataSinkWorkerEmitter,
      store,
      log,
    )

    for (const dataId of dataToProcess) {
      await service.processData(dataId)
    }
  } else {
    log.info('No old streams to process!')
  }
}
