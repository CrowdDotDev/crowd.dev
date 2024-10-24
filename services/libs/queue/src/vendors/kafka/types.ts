import { QueuePriorityLevel } from '@crowd/types'

import { IQueueInitChannelConfig } from '../../types'

export interface IKafkaChannelConfig extends IQueueInitChannelConfig {
  partitions: {
    [key in QueuePriorityLevel]?: number
  } & {
    default: number
  }
  replicationFactor: number
}

export interface IKafkaClientConfig {
  brokers: string
  clientId: string
  extra?: string
}

export interface IKafkaQueueStartOptions {
  retry?: number
}
