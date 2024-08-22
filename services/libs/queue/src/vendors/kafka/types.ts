import { IQueueInitChannelConfig } from '../../types'

export interface IKafkaChannelConfig extends IQueueInitChannelConfig {
  partitionCount: number
}

export interface IKafkaClientConfig {
  brokers: string
  clientId: string
  extra?: string
}

export interface IKafkaQueueStartOptions {
  retry?: number
}
