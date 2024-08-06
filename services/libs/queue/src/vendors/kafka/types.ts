import { IQueueConfig } from '../../types'

export interface IKafkaConfig extends IQueueConfig {
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
