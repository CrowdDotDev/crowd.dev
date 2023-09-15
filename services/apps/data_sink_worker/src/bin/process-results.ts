import { DB_CONFIG, REDIS_CONFIG, SQS_CONFIG } from '@/conf'
import DataSinkRepository from '@/repo/dataSink.repo'
import DataSinkService from '@/service/dataSink.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'

const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  const sqsClient = getSqsClient(SQS_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG())

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, log)
  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, log)

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new DataSinkService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    redisClient,
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

      await service.processResult(resultId)
    }
  }

  process.exit(0)
})
