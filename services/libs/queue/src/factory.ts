/* eslint-disable no-case-declarations */
import { Kafka } from 'kafkajs'

import { getServiceChildLogger } from '@crowd/logging'

import { IQueue, IQueueClientConfig } from './types'
import { KafkaQueueService } from './vendors/kafka/client'

export class QueueFactory {
  static createQueueService(config: IQueueClientConfig): IQueue {
    const log = getServiceChildLogger('queue-service-factory')

    log.info({ config }, 'Creating kafka queue service...')
    const kafkaClient = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers.split(','),
      sasl: {
          mechanism: 'plain', // or scram-sha-256 or scram-sha-512
          username: 'user',
          password: 'password'
        },
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      ...(config.extra ? JSON.parse(config.extra) : {}),
    })
    return new KafkaQueueService(kafkaClient, log)
  }
}
