/* eslint-disable no-case-declarations */

import { Kafka } from 'kafkajs'
import { IQueue, IQueueEnvironment, QueueVendor } from './types'
import { KafkaQueueService } from './vendors/kafka/client'
import { getServiceChildLogger } from '@crowd/logging'
import { IKafkaClientConfig } from './vendors/kafka/types'
import * as queueConfig from './config'

export class QueueFactory {
  static createQueueService(config: IQueueEnvironment): IQueue {
    const log = getServiceChildLogger('queue-service-factory')
    switch (config.vendor) {
      case QueueVendor.KAFKA:
        const kafkaConfig = config[config.vendor] as IKafkaClientConfig
        const kafkaClient = new Kafka({
          clientId: kafkaConfig.clientId,
          brokers: kafkaConfig.brokers,
        })
        return new KafkaQueueService(kafkaClient, log)
      default:
        throw new Error('Unsupported queue type')
    }
  }

  static getQueueSettings(config: IQueueEnvironment) {
    switch (config.vendor) {
      case QueueVendor.KAFKA:
        return queueConfig[config.vendor]
      default:
        throw new Error('Unsupported queue type')
    }
  }
}
