import DataSinkRepository from '@/repo/dataSink.repo'
import DataSinkService from '@/service/dataSink.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { RedisClient, processWithLock } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'

export const processOldResultsJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  nodejsWorkerEmitter: NodejsWorkerEmitter,
  searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn)
  const repo = new DataSinkRepository(store, log)
  const service = new DataSinkService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    redis,
    log,
  )

  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-results', 5 * 60, 3 * 60, async () => {
      const resultIds = await repo.getOldResultsToProcess(5)
      await repo.touchUpdatedAt(resultIds)
      return resultIds
    })
  }

  // load 5 oldest results and try process them
  let resultsToProcess = await loadNextBatch()

  while (resultsToProcess.length > 0) {
    log.info(`Detected ${resultsToProcess.length} old results rows to process!`)

    for (const resultId of resultsToProcess) {
      await service.processResult(resultId)
    }

    resultsToProcess = await loadNextBatch()
  }
}
