import { timeout } from '@crowd/common'
import { DbConnection, DbStore } from '@crowd/data-access-layer/src/database'
import { Unleash } from '@crowd/feature-flags'
import { Logger } from '@crowd/logging'
import { RedisClient } from '@crowd/redis'
import { Client as TemporalClient } from '@crowd/temporal'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'
import {
  DataSinkWorkerEmitter,
  NodejsWorkerEmitter,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'

const MAX_CONCURRENT_PROMISES = 10
const MAX_RESULTS_TO_LOAD = 200

export const processOldResultsJob = async (
  dbConn: DbConnection,
  redis: RedisClient,
  nodejsWorkerEmitter: NodejsWorkerEmitter,
  searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
  dataSinkWorkerEmitter: DataSinkWorkerEmitter,
  unleash: Unleash | undefined,
  temporal: TemporalClient,
  log: Logger,
): Promise<void> => {
  const store = new DbStore(log, dbConn, undefined, false)
  const repo = new DataSinkRepository(store, log)
  const service = new DataSinkService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    dataSinkWorkerEmitter,
    redis,
    unleash,
    temporal,
    log,
  )

  let current = 0
  const loadNextBatch = async (): Promise<string[]> => {
    const resultIds = await repo.getOldResultsToProcess(MAX_RESULTS_TO_LOAD)
    // await repo.touchUpdatedAt(resultIds)
    return resultIds
  }

  let resultsToProcess = await loadNextBatch()

  log.info(`Processing ${resultsToProcess.length} old results...`)

  let successCount = 0
  let errorCount = 0

  while (resultsToProcess.length > 0) {
    const resultId = resultsToProcess.pop()

    while (current == MAX_CONCURRENT_PROMISES) {
      await timeout(50)
    }

    current += 1
    service
      .processResult(resultId)
      .then(() => {
        current--
        successCount++
      })
      .catch(() => {
        current--
        errorCount++
      })

    if (resultsToProcess.length === 0) {
      while (current > 0) {
        await timeout(50)
      }

      log.info(`Processed ${successCount} old results successfully and ${errorCount} with errors.`)
      resultsToProcess = await loadNextBatch()
      log.info(`Processing ${resultsToProcess.length} old results...`)
      successCount = 0
      errorCount = 0
    }
  }
}
