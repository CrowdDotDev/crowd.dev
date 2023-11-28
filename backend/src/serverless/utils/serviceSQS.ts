import { SqsClient, getSqsClient } from '@crowd/sqs'
import { getServiceChildLogger } from '@crowd/logging'
import { getServiceTracer } from '@crowd/tracing'
import {
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  SearchSyncWorkerEmitter,
  DataSinkWorkerEmitter,
  IntegrationSyncWorkerEmitter,
  QueuePriorityContextLoader,
  NodejsWorkerEmitter,
} from '@crowd/common_services'
import { UnleashClient, getUnleashClient } from '@crowd/feature-flags'
import { RedisClient, getRedisClient } from '@crowd/redis'
import { REDIS_CONFIG, SERVICE, SQS_CONFIG, UNLEASH_CONFIG } from '../../conf'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { PriorityLevelContextRepository } from '@/database/repositories/priorityLevelContextRepository'

const tracer = getServiceTracer()
const log = getServiceChildLogger('service.sqs')

let sqsClient: SqsClient
export const SQS_CLIENT = (): SqsClient => {
  if (sqsClient) return sqsClient

  const config = SQS_CONFIG
  sqsClient = getSqsClient({
    region: config.aws.region,
    host: config.host,
    port: config.port,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  })
  return sqsClient
}

let unleashClient: UnleashClient | undefined
let unleashClientInitialized = false
const UNLEASH_CLIENT = async (): Promise<UnleashClient> => {
  if (unleashClientInitialized) {
    return unleashClient
  }

  unleashClient = await getUnleashClient({
    url: UNLEASH_CONFIG.url,
    apiKey: UNLEASH_CONFIG.backendApiKey,
    appName: SERVICE,
  })
  unleashClientInitialized = true
  return unleashClient
}

let redisClient: RedisClient
const REDIS_CLIENT = async (): Promise<RedisClient> => {
  if (redisClient) {
    return redisClient
  }

  redisClient = await getRedisClient(REDIS_CONFIG, true)

  return redisClient
}

let loader: QueuePriorityContextLoader
export const QUEUE_PRIORITY_LOADER = async (): Promise<QueuePriorityContextLoader> => {
  if (loader) {
    return loader
  }

  const options = await SequelizeRepository.getDefaultIRepositoryOptions()
  const repo = new PriorityLevelContextRepository(options)

  loader = (tenantId: string) => repo.loadPriorityLevelContext(tenantId)
  return loader
}

let runWorkerEmitter: IntegrationRunWorkerEmitter
export const getIntegrationRunWorkerEmitter = async (): Promise<IntegrationRunWorkerEmitter> => {
  if (runWorkerEmitter) return runWorkerEmitter

  runWorkerEmitter = new IntegrationRunWorkerEmitter(
    SQS_CLIENT(),
    await REDIS_CLIENT(),
    tracer,
    await UNLEASH_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await runWorkerEmitter.init()
  return runWorkerEmitter
}

let streamWorkerEmitter: IntegrationStreamWorkerEmitter
export const getIntegrationStreamWorkerEmitter =
  async (): Promise<IntegrationStreamWorkerEmitter> => {
    if (streamWorkerEmitter) return streamWorkerEmitter

    streamWorkerEmitter = new IntegrationStreamWorkerEmitter(
      SQS_CLIENT(),
      await REDIS_CLIENT(),
      tracer,
      await UNLEASH_CLIENT(),
      await QUEUE_PRIORITY_LOADER(),
      log,
    )
    await streamWorkerEmitter.init()
    return streamWorkerEmitter
  }

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter
export const getSearchSyncWorkerEmitter = async (): Promise<SearchSyncWorkerEmitter> => {
  if (searchSyncWorkerEmitter) return searchSyncWorkerEmitter

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(
    SQS_CLIENT(),
    await REDIS_CLIENT(),
    tracer,
    await UNLEASH_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await searchSyncWorkerEmitter.init()
  return searchSyncWorkerEmitter
}

let integrationSyncWorkerEmitter: IntegrationSyncWorkerEmitter
export const getIntegrationSyncWorkerEmitter = async (): Promise<IntegrationSyncWorkerEmitter> => {
  if (integrationSyncWorkerEmitter) return integrationSyncWorkerEmitter

  integrationSyncWorkerEmitter = new IntegrationSyncWorkerEmitter(
    SQS_CLIENT(),
    await REDIS_CLIENT(),
    tracer,
    await UNLEASH_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await integrationSyncWorkerEmitter.init()
  return integrationSyncWorkerEmitter
}

let dataSinkWorkerEmitter: DataSinkWorkerEmitter
export const getDataSinkWorkerEmitter = async (): Promise<DataSinkWorkerEmitter> => {
  if (dataSinkWorkerEmitter) return dataSinkWorkerEmitter

  dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
    SQS_CLIENT(),
    await REDIS_CLIENT(),
    tracer,
    await UNLEASH_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await dataSinkWorkerEmitter.init()
  return dataSinkWorkerEmitter
}

let nodejsWorkerEmitter: NodejsWorkerEmitter
export const getNodejsWorkerEmitter = async (): Promise<NodejsWorkerEmitter> => {
  if (nodejsWorkerEmitter) return nodejsWorkerEmitter

  nodejsWorkerEmitter = new NodejsWorkerEmitter(
    SQS_CLIENT(),
    await REDIS_CLIENT(),
    tracer,
    await UNLEASH_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await nodejsWorkerEmitter.init()
  return nodejsWorkerEmitter
}
