import { SendMessageBatchCommandOutput, SendMessageResult, SQSClient } from '@aws-sdk/client-sqs'
import { IQueueMessage, IQueueMessageBulk, QueuePriorityLevel } from '@crowd/types'
import { Kafka, KafkaMessage, RecordMetadata } from 'kafkajs'
import { IKafkaClientConfig } from './vendors/kafka/types'
import { SqsMessage } from './vendors/sqs/types'

export type IQueueClient = Kafka | SQSClient

// export type IQueueConfig = IKafkaConfig
export interface IQueueConfig {
  name: string
}

export interface IQueueInitChannelConfig {
  name: string
}

export type IQueueSendResult = RecordMetadata[] | SendMessageResult

export type IQueueSendBulkResult = RecordMetadata[] | SendMessageBatchCommandOutput

export type IQueueClientConfig = IKafkaClientConfig

export type IQueueReceiveResponse = KafkaMessage | SqsMessage

export type IQueueProcessMessageHandler = (
  message: IQueueMessage,
  options?: unknown,
) => Promise<void>

export interface IQueueChannel {
  name: string
  url?: string
}

export interface IQueue {
  client: IQueueClient
  getClient(): IQueueClient
  init(config: IQueueInitChannelConfig, level?: QueuePriorityLevel): Promise<string>
  getQueueChannelConfig(queue: CrowdQueue): IQueueConfig
  start(
    processMessageFunction: IQueueProcessMessageHandler,
    maxConcurrentMessageProcessing: number,
    queueConf: IQueueConfig,
    options?: unknown,
  ): Promise<void>
  stop(): void
  send(
    channel: IQueueChannel,
    message: IQueueMessage,
    groupId: string,
    options?: unknown,
  ): Promise<IQueueSendResult>
  sendBulk(
    channel: IQueueChannel,
    messages: IQueueMessageBulk<IQueueMessage>[],
    options?: unknown,
  ): Promise<IQueueSendBulkResult>
  receive(channel: IQueueChannel, options?: unknown): Promise<IQueueReceiveResponse[]>
  delete(channel: IQueueChannel, options?: unknown): Promise<void>
  getMessageBody(message: IQueueReceiveResponse): IQueueMessage
  getMessageId(message: IQueueReceiveResponse): string
  getReceiptHandle(message: IQueueReceiveResponse): string
  setMessageVisibilityTimeout(
    channel: IQueueChannel,
    handle: string,
    newTimeout: number,
    options?: unknown,
  ): Promise<unknown>
}

export enum CrowdQueue {
  INTEGRATION_RUN_WORKER = 'integration-run-worker',
  INTEGRATION_STREAM_WORKER = 'integration-stream-worker',
  DATA_SINK_WORKER = 'data-sink-worker',
  SEARCH_SYNC_WORKER = 'search-sync-worker',
  INTEGRATION_SYNC_WORKER = 'integration-sync-worker',
}

export enum QueueVendor {
  KAFKA = 'kafka',
  SQS = 'sqs',
}
