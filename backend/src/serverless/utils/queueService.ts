import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  QueuePriorityContextLoader,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { getServiceChildLogger } from '@crowd/logging'
import { IQueue, QueueFactory } from '@crowd/queue'
import { RedisClient, getRedisClient } from '@crowd/redis'

import { PriorityLevelContextRepository } from '@/database/repositories/priorityLevelContextRepository'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { QUEUE_CONFIG, REDIS_CONFIG } from '../../conf'

const log = getServiceChildLogger('service.queue')

let queueClient: IQueue
export const QUEUE_CLIENT = (): IQueue => {
  if (queueClient) return queueClient

  // TODO: will be bound to an environment variable
  queueClient = QueueFactory.createQueueService(QUEUE_CONFIG)
  return queueClient
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
    QUEUE_CLIENT(),
    await REDIS_CLIENT(),
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
      QUEUE_CLIENT(),
      await REDIS_CLIENT(),
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
    QUEUE_CLIENT(),
    await REDIS_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await searchSyncWorkerEmitter.init()
  return searchSyncWorkerEmitter
}

let dataSinkWorkerEmitter: DataSinkWorkerEmitter
export const getDataSinkWorkerEmitter = async (): Promise<DataSinkWorkerEmitter> => {
  if (dataSinkWorkerEmitter) return dataSinkWorkerEmitter

  dataSinkWorkerEmitter = new DataSinkWorkerEmitter(
    QUEUE_CLIENT(),
    await REDIS_CLIENT(),
    await QUEUE_PRIORITY_LOADER(),
    log,
  )
  await dataSinkWorkerEmitter.init()
  return dataSinkWorkerEmitter
}
