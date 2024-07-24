import { IQueueConfig } from '../../types'

export interface IKafkaConfig extends IQueueConfig {
  partitionCount: number
}

export interface IKafkaClientConfig {
  brokers: string[]
  clientId: string
}
