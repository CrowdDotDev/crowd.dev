import { DATABASE_IOC, DbStore } from '@crowd/database'
import { IOC } from '@crowd/ioc'
import { LOGGING_IOC, Logger, getChildLogger } from '@crowd/logging'
import { REDIS_IOC, RedisClient, processWithLock } from '@crowd/redis'
import { APP_IOC } from 'ioc_constants'
import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'

export const processOldResultsJob = async (): Promise<void> => {
  const ioc = IOC()

  const log = getChildLogger('processOldResultsJob', ioc.get<Logger>(LOGGING_IOC.logger))

  const redis = ioc.get<RedisClient>(REDIS_IOC.client)
  const repo = new DataSinkRepository(ioc.get<DbStore>(DATABASE_IOC.store), log)
  const service = ioc.get<DataSinkService>(APP_IOC.dataSinkService)

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-results', 5 * 60, 3 * 60, async () => {
      const resultIds = await repo.getOldResultsToProcess(5)
      await repo.touchUpdatedAt(resultIds)
      return resultIds
    })
  }

  // load 5 oldest results and try process them
  let resultsToProcess = await loadNextBatch()

  let successCount = 0
  let errorCount = 0

  while (resultsToProcess.length > 0) {
    log.info(`Detected ${resultsToProcess.length} old results rows to process!`)

    for (const resultId of resultsToProcess) {
      try {
        const result = await service.processResult(resultId)
        if (result) {
          successCount++
        } else {
          errorCount++
        }
      } catch (err) {
        log.error(err, 'Failed to process result!')
        errorCount++
      }
    }

    log.info(`Processed ${successCount} old results successfully and ${errorCount} with errors.`)

    resultsToProcess = await loadNextBatch()
  }
}
