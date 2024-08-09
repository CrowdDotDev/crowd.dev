import { CrowdQueue } from '../../types'
import { IKafkaConfig } from './types'

export const INTEGRATION_RUN_WORKER_QUEUE_SETTINGS: IKafkaConfig = {
  name: CrowdQueue.INTEGRATION_RUN_WORKER,
  partitionCount: 2,
}

export const INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS: IKafkaConfig = {
  name: CrowdQueue.INTEGRATION_STREAM_WORKER,
  partitionCount: 2,
}

export const DATA_SINK_WORKER_QUEUE_SETTINGS: IKafkaConfig = {
  name: CrowdQueue.DATA_SINK_WORKER,
  partitionCount: 2,
}

export const SEARCH_SYNC_WORKER_QUEUE_SETTINGS: IKafkaConfig = {
  name: CrowdQueue.SEARCH_SYNC_WORKER,
  partitionCount: 2,
}

export const INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS: IKafkaConfig = {
  name: CrowdQueue.INTEGRATION_SYNC_WORKER,
  partitionCount: 2,
}

export const configMap = {
  [CrowdQueue.INTEGRATION_RUN_WORKER]: INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  [CrowdQueue.INTEGRATION_STREAM_WORKER]: INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  [CrowdQueue.DATA_SINK_WORKER]: DATA_SINK_WORKER_QUEUE_SETTINGS,
  [CrowdQueue.SEARCH_SYNC_WORKER]: SEARCH_SYNC_WORKER_QUEUE_SETTINGS,
  [CrowdQueue.INTEGRATION_SYNC_WORKER]: INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS,
}
