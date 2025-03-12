/* eslint-disable no-case-declarations */
import { Kafka } from 'kafkajs'

import { SERVICE } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'

import { IQueue, IQueueClientConfig } from './types'
import { KafkaQueueService } from './vendors/kafka/client'

export class QueueFactory {
  static createQueueService(config: IQueueClientConfig): IQueue {
    const log = getServiceChildLogger('queue-service-factory')

    log.info({ config }, 'Creating kafka queue service...')
    const kafkaClient = new Kafka({
      clientId: config.clientId,
      logLevel: process.env.KAFKA_LOG_LEVEL ? Number(process.env.KAFKA_LOG_LEVEL) : undefined,
      brokers: config.brokers.split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      ...(config.extra ? JSON.parse(config.extra) : {}),
    })
    return new KafkaQueueService(kafkaClient, log)
  }
}

let queueConfig: IQueueClientConfig | undefined = undefined
export const QUEUE_CONFIG = (): IQueueClientConfig => {
  if (!queueConfig) {
    queueConfig = {
      brokers: process.env.CROWD_KAFKA_BROKERS,
      clientId: SERVICE,
      extra: process.env.CROWD_KAFKA_EXTRA || undefined,
    }
  }

  return queueConfig
}
