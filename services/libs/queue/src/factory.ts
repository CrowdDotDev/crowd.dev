/* eslint-disable no-case-declarations */

import { getServiceChildLogger } from '@crowd/logging'
import { Kafka } from 'kafkajs'
import { IQueue } from './types'
import { KafkaQueueService } from './vendors/kafka/client'
import { IKafkaClientConfig } from './vendors/kafka/types'

export class QueueFactory {
  static createQueueService(config: IKafkaClientConfig): IQueue {
    const log = getServiceChildLogger('queue-service-factory')

    log.info({ config }, 'Creating kafka queue service...')
    const kafkaClient = new Kafka({
      clientId: config.clientId,
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
