import { QueueVendor } from './types'
import * as KafkaQueueConfig from './vendors/kafka/config'
import * as SqsQueueConfig from './vendors/sqs/config'

export const INTEGRATION_RUN_WORKER_QUEUE_SETTINGS = {
  [QueueVendor.KAFKA]: KafkaQueueConfig.INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
  [QueueVendor.SQS]: SqsQueueConfig.INTEGRATION_RUN_WORKER_QUEUE_SETTINGS,
}

export const INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS = {
  [QueueVendor.KAFKA]: KafkaQueueConfig.INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
  [QueueVendor.SQS]: SqsQueueConfig.INTEGRATION_STREAM_WORKER_QUEUE_SETTINGS,
}

export const DATA_SINK_WORKER_QUEUE_SETTINGS = {
  [QueueVendor.KAFKA]: KafkaQueueConfig.DATA_SINK_WORKER_QUEUE_SETTINGS,
  [QueueVendor.SQS]: SqsQueueConfig.DATA_SINK_WORKER_QUEUE_SETTINGS,
}

export const SEARCH_SYNC_WORKER_QUEUE_SETTINGS = {
  [QueueVendor.KAFKA]: KafkaQueueConfig.SEARCH_SYNC_WORKER_QUEUE_SETTINGS,
  [QueueVendor.SQS]: SqsQueueConfig.SEARCH_SYNC_WORKER_QUEUE_SETTINGS,
}
