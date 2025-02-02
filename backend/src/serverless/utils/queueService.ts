import {
  DataSinkWorkerEmitter,
  IntegrationRunWorkerEmitter,
  IntegrationStreamWorkerEmitter,
  SearchSyncWorkerEmitter,
} from '@crowd/common_services'
import { getServiceChildLogger } from '@crowd/logging'
import { IQueue, QueueFactory } from '@crowd/queue'

import { QUEUE_CONFIG } from '../../conf'

const log = getServiceChildLogger('service.queue')

let queueClient: IQueue
export const QUEUE_CLIENT = (): IQueue => {
  if (queueClient) return queueClient

  // TODO: will be bound to an environment variable
  queueClient = QueueFactory.createQueueService(QUEUE_CONFIG)
  return queueClient
}

let runWorkerEmitter: IntegrationRunWorkerEmitter
export const getIntegrationRunWorkerEmitter = async (): Promise<IntegrationRunWorkerEmitter> => {
  if (runWorkerEmitter) return runWorkerEmitter

  runWorkerEmitter = new IntegrationRunWorkerEmitter(QUEUE_CLIENT(), log)
  await runWorkerEmitter.init()
  return runWorkerEmitter
}

let streamWorkerEmitter: IntegrationStreamWorkerEmitter
export const getIntegrationStreamWorkerEmitter =
  async (): Promise<IntegrationStreamWorkerEmitter> => {
    if (streamWorkerEmitter) return streamWorkerEmitter

    streamWorkerEmitter = new IntegrationStreamWorkerEmitter(QUEUE_CLIENT(), log)
    await streamWorkerEmitter.init()
    return streamWorkerEmitter
  }

let searchSyncWorkerEmitter: SearchSyncWorkerEmitter
export const getSearchSyncWorkerEmitter = async (): Promise<SearchSyncWorkerEmitter> => {
  if (searchSyncWorkerEmitter) return searchSyncWorkerEmitter

  searchSyncWorkerEmitter = new SearchSyncWorkerEmitter(QUEUE_CLIENT(), log)
  await searchSyncWorkerEmitter.init()
  return searchSyncWorkerEmitter
}

let dataSinkWorkerEmitter: DataSinkWorkerEmitter
export const getDataSinkWorkerEmitter = async (): Promise<DataSinkWorkerEmitter> => {
  if (dataSinkWorkerEmitter) return dataSinkWorkerEmitter

  dataSinkWorkerEmitter = new DataSinkWorkerEmitter(QUEUE_CLIENT(), log)
  await dataSinkWorkerEmitter.init()
  return dataSinkWorkerEmitter
}
