import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Unleash } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient, processWithLock } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import { Client as TemporalClient } from '@crowd/temporal'

const MAX_CONCURRENT_PROMISES = 3

export const processOldResultsJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  nodejsWorkerEmitter: NodejsWorkerEmitter,
  searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
  unleash: Unleash | undefined,
  temporal: TemporalClient,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn)
  const repo = new DataSinkRepository(store, log)
  const service = new DataSinkService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    redis,
    unleash,
    temporal,
    log,
  )

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-results', 5 * 60, 3 * 60, async () => {
      const resultIds = await repo.getOldResultsToProcess(MAX_CONCURRENT_PROMISES)
      await repo.touchUpdatedAt(resultIds)
      return resultIds
    })
  }

  // load 3 oldest results and try process them
  let resultsToProcess = await loadNextBatch()

  let successCount = 0
  let errorCount = 0

  while (resultsToProcess.length > 0) {
    log.info(`Detected ${resultsToProcess.length} old results rows to process!`)

    const promises = []
    for (const resultId of resultsToProcess) {
      promises.push(
        service
          .processResult(resultId)
          .then((result) => {
            if (result) {
              successCount++
            } else {
              errorCount++
            }
          })
          .catch((err) => {
            log.error(err, 'Failed to process result!')
            errorCount++
          }),
      )

      if (promises.length >= MAX_CONCURRENT_PROMISES) {
        await Promise.all(promises)
        promises.length = 0
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
    }

    log.info(`Processed ${successCount} old results successfully and ${errorCount} with errors.`)

    resultsToProcess = await loadNextBatch()
  }
}
