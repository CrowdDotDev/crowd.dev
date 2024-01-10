import {
  ChangeMessageVisibilityRequest,
  DeleteMessageRequest,
  Message,
  MessageAttributeValue,
  ReceiveMessageRequest,
  SQSClient,
  SendMessageBatchRequest,
  SendMessageRequest,
} from '@aws-sdk/client-sqs'

export type SqsClient = SQSClient
export type SqsMessage = Message
export type SqsReceiveMessageRequest = ReceiveMessageRequest
export type SqsDeleteMessageRequest = DeleteMessageRequest
export type SqsSendMessageRequest = SendMessageRequest
export type SqsSendMessageBatchRequest = SendMessageBatchRequest
export type SqsChangeMessageVisibilityRequest = ChangeMessageVisibilityRequest
export type SqsMessageAttributes = Record<string, MessageAttributeValue>

export interface ISqsClientConfig {
  region: string
  host?: string
  port?: number
  accessKeyId: string
  secretAccessKey: string
}

export enum SqsQueueType {
  STANDARD = 'STANDARD',
  FIFO = 'FIFO',
}

export enum SqsQueueDeduplicationType {
  MESSAGE_GROUP = 'messageGroup',
}

export enum SqsFifoThroughputLimitType {
  PER_MESSAGE_GROUP_ID = 'perMessageGroupId',
}

export enum CrowdQueue {
  INTEGRATION_RUN_WORKER = 'integration-run-worker',
  INTEGRATION_STREAM_WORKER = 'integration-stream-worker',
  INTEGRATION_DATA_WORKER = 'integration-data-worker',
  DATA_SINK_WORKER = 'data-sink-worker',
  NODEJS_WORKER = 'nodejs-worker',
  SEARCH_SYNC_WORKER = 'search-sync-worker',
  INTEGRATION_SYNC_WORKER = 'integration-sync-worker',
}

export interface ISqsQueueConfig {
  name: string
  type: SqsQueueType
  waitTimeSeconds: number
  visibilityTimeout: number
  messageRetentionPeriod: number
  deliveryDelay: number
  deduplicationScope?: SqsQueueDeduplicationType
  fifoThroughputLimit?: SqsFifoThroughputLimitType
}
