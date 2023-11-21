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
