import { DataSinkWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'
import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { getServiceLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'
import { QueueFactory } from '@crowd/queue'
import { getRedisClient } from '@crowd/redis'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

import { DB_CONFIG, QUEUE_CONFIG, REDIS_CONFIG, TEMPORAL_CONFIG } from '../conf'
import DataSinkService from '../service/dataSink.service'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const redis = await getRedisClient(REDIS_CONFIG())
  const dbConnection = await getDbConnection(DB_CONFIG())
  const qdbConnection = await getClientSQL()
  const store = new DbStore(log, dbConnection)
  const qdbStore = new DbStore(log, qdbConnection)

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(queueClient, log)
  await searchSyncWorkerEmitter.init()

  const dataSinkWorkerEmitter = new DataSinkWorkerEmitter(queueClient, log)
  await dataSinkWorkerEmitter.init()

  const service = new DataSinkService(
    store,
    qdbStore,
    searchSyncWorkerEmitter,
    dataSinkWorkerEmitter,
    redis,
    temporal,
    queueClient,
    log,
  )

  const repo = new DataSinkRepository(store, log)
  for (const resultId of resultIds) {
    const result = await repo.getResultInfo(resultId)
    if (!result) {
      log.error(`Result ${resultId} not found!`)
      continue
    } else {
      await repo.resetResults([resultId])

      await service.processResults([{ resultId, data: result, created: true }])
    }
  }

  process.exit(0)
})
