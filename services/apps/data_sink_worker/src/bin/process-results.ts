import {
  DB_CONFIG,
  REDIS_CONFIG,
  SQS_CONFIG,
  SENTIMENT_CONFIG,
  TEMPORAL_CONFIG,
  UNLEASH_CONFIG,
} from '../conf'
import DataSinkRepository from '../repo/dataSink.repo'
import DataSinkService from '../service/dataSink.service'
import { DbStore, getDbConnection } from '@crowd/database'
import { getServiceTracer } from '@crowd/tracing'
import { getServiceLogger } from '@crowd/logging'
import { getRedisClient } from '@crowd/redis'
import { NodejsWorkerEmitter, SearchSyncWorkerEmitter, getSqsClient } from '@crowd/sqs'
import { initializeSentimentAnalysis } from '@crowd/sentiment'
import { getUnleashClient } from '@crowd/feature-flags'
import { Client as TemporalClient, getTemporalClient } from '@crowd/temporal'

const tracer = getServiceTracer()
const log = getServiceLogger()

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected 1 argument: resultIds')
  process.exit(1)
}

const resultIds = processArguments[0].split(',')

setImmediate(async () => {
  const unleash = await getUnleashClient(UNLEASH_CONFIG())

  let temporal: TemporalClient | undefined
  // temp for production
  if (TEMPORAL_CONFIG().serverUrl) {
    temporal = await getTemporalClient(TEMPORAL_CONFIG())
  }

  const sqsClient = getSqsClient(SQS_CONFIG())
  const redisClient = await getRedisClient(REDIS_CONFIG())

  initializeSentimentAnalysis(SENTIMENT_CONFIG())

  const nodejsWorkerEmitter = new NodejsWorkerEmitter(sqsClient, tracer, log)
  await nodejsWorkerEmitter.init()

  const searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(sqsClient, tracer, log)
  await searchSyncWorkerEmitter.init()

  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  const service = new DataSinkService(
    store,
    nodejsWorkerEmitter,
    searchSyncWorkerEmitter,
    redisClient,
    unleash,
    temporal,
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
