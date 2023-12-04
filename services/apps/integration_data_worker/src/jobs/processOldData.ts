import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { DataSinkWorkerEmitter, IntegrationStreamWorkerEmitter } from '@crowd/sqs'
import IntegrationDataRepository from '../repo/integrationData.repo'
import IntegrationDataService from '../service/integrationDataService'

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
    return await repo.transactionally(async (txRepo) => {
      const dataIds = await txRepo.getOldDataToProcess(5)
      await txRepo.touchUpdatedAt(dataIds)
      return dataIds
    })
  }

  // load 5 oldest apiData and try process them
  let dataToProcess = await loadNextBatch()

  let successCount = 0
  let errorCount = 0

  while (dataToProcess.length > 0) {
    for (const dataId of dataToProcess) {
      try {
        const result = await service.processData(dataId)
        if (result) {
          successCount++
        } else {
          errorCount++
        }
      } catch (err) {
        log.error(err, 'Failed to process data!')
        errorCount++
      }
    }

    log.info(`Processed ${successCount} old data successfully and ${errorCount} with errors.`)

    dataToProcess = await loadNextBatch()
  }
}
