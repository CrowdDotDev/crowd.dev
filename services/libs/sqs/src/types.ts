import { Message, SQSClient } from '@aws-sdk/client-sqs'

export type SqsClient = SQSClient
export type SqsMessage = Message

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
  MESSAGE_GROUP = 'MessageGroup',
}

export enum SqsFifoThroughputLimitType {
  PER_MESSAGE_GROUP_ID = 'PerMessageGroupId',
}

export interface ISqsQueueConfig {
  name: string
  type: SqsQueueType
  waitTimeSeconds: number
  visibilityTimeout: number
  messageRetentionPeriod: number
  deliveryDelay: number
  deduplicationScope?: SqsQueueDeduplicationType
  highThroughputFifo?: boolean
  fifoThroughputLimit?: SqsFifoThroughputLimitType
}

export interface IQueueMessage {
  type: string
}
