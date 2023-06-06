import {
  ISqsQueueConfig,
  SqsFifoThroughputLimitType,
  SqsQueueDeduplicationType,
  SqsQueueType,
} from './types'

export const INTEGRATION_RUN_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: 'integration-run-worker',
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: 'integration-stream-worker',
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const INTEGRATION_DATA_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: 'integration-data-worker',
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const DATA_SINK_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: 'data-sink-worker',
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}

export const NODEJS_WORKER_QUEUE_SETTINGS: ISqsQueueConfig = {
  name: 'nodejs-worker',
  type: SqsQueueType.FIFO,
  waitTimeSeconds: 20, // seconds
  visibilityTimeout: 30, // seconds
  messageRetentionPeriod: 345600, // 4 days
  deliveryDelay: 0,
  deduplicationScope: SqsQueueDeduplicationType.MESSAGE_GROUP,
  fifoThroughputLimit: SqsFifoThroughputLimitType.PER_MESSAGE_GROUP_ID,
}
