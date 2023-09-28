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
  const service = new IntegrationDataService(
    redis,
    streamWorkerEmitter,
    dataSinkWorkerEmitter,
    store,
    log,
  )

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-data', 5 * 60, 3 * 60, async () => {
      const dataIds = await repo.getOldDataToProcess(5)
      await repo.touchUpdatedAt(dataIds)
      return dataIds
    })
  }

  // load 5 oldest apiData and try process them
  let dataToProcess = await loadNextBatch()

  while (dataToProcess.length > 0) {
    log.info(`Detected ${dataToProcess.length} old data rows to process!`)

    for (const dataId of dataToProcess) {
      try {
        await service.processData(dataId)
      } catch (err) {
        log.error(err, 'Failed to process data!')
      }
    }

    dataToProcess = await loadNextBatch()
  }
}
