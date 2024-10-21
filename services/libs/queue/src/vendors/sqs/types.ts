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

import { IQueueConfig } from '../../types'

export interface ISqsClientConfig {
  host: string
  port: number
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export type SqsClient = SQSClient
export type SqsMessage = Message
export type SqsReceiveMessageRequest = ReceiveMessageRequest
export type SqsDeleteMessageRequest = DeleteMessageRequest
export type SqsSendMessageRequest = SendMessageRequest
export type SqsSendMessageBatchRequest = SendMessageBatchRequest
export type SqsChangeMessageVisibilityRequest = ChangeMessageVisibilityRequest
export type SqsMessageAttributes = Record<string, MessageAttributeValue>

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

export interface ISqsConfig extends IQueueConfig {
  type: SqsQueueType
  waitTimeSeconds: number
  visibilityTimeout: number
  messageRetentionPeriod: number
  deliveryDelay: number
  deduplicationScope?: SqsQueueDeduplicationType
  fifoThroughputLimit?: SqsFifoThroughputLimitType
}

export interface ISqsQueueSendOptions {
  config: ISqsConfig
  deduplicationId?: string
  retry?: number
}

export interface ISqsQueueReceiveOptions {
  deleteMessageImmediately: boolean
  visibilityTimeoutSeconds: number
  receiveMessageCount: number
}

export interface ISqsQueueStartOptions {
  deleteMessageImmediately: boolean
  visibilityTimeoutSeconds: number
  receiveMessageCount: number
}

export interface ISqsQueueDeleteOptions {
  receiptHandle: string
  retry?: number
}

export interface ISqsQueueSetMessageVisibilityOptions {
  retry?: number
}
