import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Unleash } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient, processWithLock } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import { Client as TemporalClient } from '@crowd/temporal'
import { timeout } from '@crowd/common'

const MAX_CONCURRENT_PROMISES = 10
const MAX_RESULTS_TO_LOAD = 100

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

  let current = 0
  const loadNextBatch = async (): Promise<string[]> => {
    return await processWithLock(redis, 'process-old-results', 5 * 60, 3 * 60, async () => {
      const resultIds = await repo.getOldResultsToProcess(MAX_RESULTS_TO_LOAD)
      await repo.touchUpdatedAt(resultIds)
      return resultIds
    })
  }

  let resultsToProcess = await loadNextBatch()

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < resultsToProcess.length; i++) {
    const resultId = resultsToProcess[i]

    while (current == MAX_CONCURRENT_PROMISES) {
      await timeout(1000)
    }

    log.info(`Processing result ${i + 1}/${resultsToProcess.length}`)
    current += 1
    service
      .processResult(resultId)
      .then(() => {
        current--
        successCount++
        log.info(`Processed result ${i + 1}/${resultsToProcess.length}`)
      })
      .catch((err) => {
        current--
        errorCount++
        log.error(err, `Error processing result ${i + 1}/${resultsToProcess.length}!`)
      })
  }

  while (current > 0) {
    await timeout(1000)
  }

  log.info(`Processed ${successCount} old results successfully and ${errorCount} with errors.`)

  if (resultsToProcess.length === 0) {
    resultsToProcess = await loadNextBatch()
  }
}
