import { Kafka, KafkaMessage } from 'kafkajs'
import { IKafkaClientConfig } from './vendors/kafka/types'
import { ISqsClientConfig } from './vendors/sqs/types'
import { IQueueMessage } from '@crowd/types'

export type IQueueClient = Kafka

// export type IQueueConfig = IKafkaConfig
export interface IQueueConfig {
  name: string
}

export type IQueueClientConfig = IKafkaClientConfig | ISqsClientConfig

export type IQueueReceiveResponse = KafkaMessage

export type IQueueProcessMessageHandler = (message: IQueueMessage) => Promise<void>

export interface IQueueChannel {
  name: string
  url?: string
}

export type IQueueEnvironment = {
  vendor: QueueVendor
} & {
  [key in QueueVendor]: IQueueClientConfig
}

export interface IQueue {
  client: IQueueClient
  getClient(): IQueueClient
  init(config: IQueueConfig): Promise<void>
  getQueueConfig(queue: CrowdQueue): IQueueConfig
  start(
    processMessageFunction: IQueueProcessMessageHandler,
    maxConcurrentMessageProcessing: number,
    queueConf: IQueueConfig,
  ): Promise<void>
  stop(): void
  send(channel: IQueueChannel, message: IQueueMessage, options?: unknown): Promise<void>
  sendBulk(channel: IQueueChannel, messages: IQueueMessage[], options?: unknown): Promise<void>
  receive(channel: IQueueChannel, options?: unknown): Promise<IQueueReceiveResponse[]>
  delete(channel: IQueueChannel, options?: unknown): Promise<void>
  getMessageBody(message: IQueueReceiveResponse): IQueueMessage
  getMessageId(message: IQueueReceiveResponse): string
  getReceiptHandle(message: IQueueReceiveResponse): string
  setMessageVisibilityTimeout(handle: string, newTimeout: number): Promise<void>
}

export enum CrowdQueue {
  INTEGRATION_RUN_WORKER = 'integration-run-worker',
  INTEGRATION_STREAM_WORKER = 'integration-stream-worker',
  DATA_SINK_WORKER = 'data-sink-worker',
  NODEJS_WORKER = 'nodejs-worker',
  SEARCH_SYNC_WORKER = 'search-sync-worker',
  INTEGRATION_SYNC_WORKER = 'integration-sync-worker',
}

export enum QueueVendor {
  KAFKA = 'kafka',
  SQS = 'sqs',
}
