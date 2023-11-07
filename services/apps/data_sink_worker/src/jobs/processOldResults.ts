import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'
import { DbConnection, DbStore } from '@crowd/database'
import { Unleash } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/sqs'
import { Client as TemporalClient } from '@crowd/temporal'
import { timeout } from '@crowd/common'

const MAX_CONCURRENT_PROMISES = 10
const MAX_RESULTS_TO_LOAD = 1000

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
    const resultIds = await repo.getOldResultsToProcess(MAX_RESULTS_TO_LOAD)
    await repo.touchUpdatedAt(resultIds)
    return resultIds
  }

  let resultsToProcess = await loadNextBatch()

  log.info(`Processing ${resultsToProcess.length} old results...`)

  let successCount = 0
  let errorCount = 0
  let i = 0
  let batchLength = resultsToProcess.length

  while (resultsToProcess.length > 0) {
    const resultId = resultsToProcess.pop()

    while (current == MAX_CONCURRENT_PROMISES) {
      await timeout(1000)
    }

    const currentIndex = i
    i += 1
    log.info(`Processing result ${currentIndex + 1}/${batchLength}`)
    current += 1
    service
      .processResult(resultId)
      .then(() => {
        current--
        successCount++
        log.info(`Processed result ${currentIndex + 1}/${batchLength}`)
      })
      .catch((err) => {
        current--
        errorCount++
        log.error(err, `Error processing result ${currentIndex + 1}/${batchLength}!`)
      })

    if (resultsToProcess.length === 0) {
      while (current > 0) {
        await timeout(1000)
      }

      log.info(`Processed ${successCount} old results successfully and ${errorCount} with errors.`)
      resultsToProcess = await loadNextBatch()
      log.info(`Processing ${resultsToProcess.length} old results...`)
      successCount = 0
      errorCount = 0
      i = 0
      batchLength = resultsToProcess.length
    }
  }
}
