import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { REDIS_IOC, RedisClient, processWithLock } from '@crowd/redis'
import { APP_IOC } from 'ioc_constants'
import IntegrationDataRepository from '../repo/integrationData.repo'
import IntegrationDataService from '../service/integrationDataService'

export const processOldDataJob = async (): Promise<void> => {
  const ioc = IOC()
  const log = getChildLogger('processOldDataJob', ioc.get<Logger>(LOGGING_IOC.logger))
  const redis = ioc.get<RedisClient>(REDIS_IOC.client)
  const store = ioc.get<DbStore>(DATABASE_IOC.store)
  const repo = new IntegrationDataRepository(store, log)
  const service = ioc.get<IntegrationDataService>(APP_IOC.dataService)

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-data', 5 * 60, 3 * 60, async () => {
      const dataIds = await repo.getOldDataToProcess(5)
      await repo.touchUpdatedAt(dataIds)
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
