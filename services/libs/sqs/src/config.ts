import {
  CrowdQueue,
  ISqsQueueConfig,
  SqsFifoThroughputLimitType,
  SqsQueueDeduplicationType,
  SqsQueueType,
} from './types'

export const INTEGRATION_RUN_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.INTEGRATION_RUN_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.INTEGRATION_STREAM_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const INTEGRATION_DATA_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.INTEGRATION_DATA_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const DATA_SINK_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.DATA_SINK_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const NODEJS_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.NODEJS_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const SEARCH_SYNC_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.SEARCH_SYNC_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const INTEGRATION_SYNC_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: CrowdQueue.INTEGRATION_SYNC_WORKER,
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}
