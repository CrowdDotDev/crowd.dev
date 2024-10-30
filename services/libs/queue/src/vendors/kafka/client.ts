/* eslint-disable @typescript-eslint/no-unused-vars */
import { createHash } from 'crypto'
import { Admin, Consumer, EachMessagePayload, Kafka, KafkaMessage } from 'kafkajs'

import { timeout } from '@crowd/common'
import { Logger, LoggerBase } from '@crowd/logging'
import { IQueueMessage, IQueueMessageBulk, QueuePriorityLevel } from '@crowd/types'

import {
  CrowdQueue,
  IQueue,
  IQueueChannel,
  IQueueProcessMessageHandler,
  IQueueSendBulkResult,
  IQueueSendResult,
} from '../../types'

import { configMap } from './config'
import { IKafkaChannelConfig, IKafkaQueueStartOptions } from './types'

export class KafkaQueueService extends LoggerBase implements IQueue {
  private consumers: Map<string, Consumer>
  private processingMessages: number
  private started: boolean

  public constructor(
    public readonly client: Kafka,
    parentLog: Logger,
  ) {
    super(parentLog, {
      service: 'kafka-queue',
    })
    this.processingMessages = 0
    this.started = false
    this.consumers = new Map<string, Consumer>()
  }

  public async send(
    channel: IQueueChannel,
    message: IQueueMessage,
    groupId: string,
  ): Promise<IQueueSendResult> {
    // send message to kafka
    const producer = this.client.producer()
    await producer.connect()
    const result = await producer.send({
      topic: channel.name,
      messages: [
        {
          key: groupId,
          value: JSON.stringify(message),
        },
      ],
    })

    this.log.trace({ message: message, topic: channel.name }, 'Message sent to Kafka topic!')

    await producer.disconnect()
    return result
  }

  async receive(channel: IQueueChannel): Promise<KafkaMessage[]> {
    const consumer = await this.getConsumer(channel.name)
    await consumer.subscribe({ topic: channel.name, fromBeginning: true })
    return new Promise<KafkaMessage[]>((resolve) => {
      consumer.run({
        eachMessage: async ({ message }: EachMessagePayload) => {
          resolve([message])
          await consumer.disconnect()
          this.consumers.delete(channel.name)
        },
      })
    })
  }

  private async getConsumer(groupId: string): Promise<Consumer> {
    if (!this.consumers.get(groupId)) {
      const consumer = this.client.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      })
      consumer.on(consumer.events.GROUP_JOIN, () => {
        this.log.info('Consumer has joined the group')
      })

      consumer.on(consumer.events.REBALANCING, () => {
        this.log.info('Consumer group is rebalancing')
      })

      consumer.on(consumer.events.DISCONNECT, () => {
        this.log.info('Consumer has been disconnected')
      })
      this.consumers.set(groupId, consumer)
      await consumer.connect()
    }
    return this.consumers.get(groupId)
  }

  public getClient() {
    return this.client
  }

  public async init(config: IKafkaChannelConfig, level?: QueuePriorityLevel): Promise<string> {
    this.log.info({ config }, 'Initializing queue!')

    const admin = this.client.admin()
    await admin.connect()

    let partitionCount

    if (level && config.partitions[level]) {
      partitionCount = config.partitions[level]
    } else if (config.partitions.default) {
      partitionCount = config.partitions.default
    } else {
      partitionCount = 1
    }

    try {
      const existingTopics = await admin.listTopics()
      if (!existingTopics.includes(config.name)) {
        await admin.createTopics({
          topics: [
            {
              topic: config.name,
              numPartitions: partitionCount,
              replicationFactor: config.replicationFactor || 1,
              configEntries: [
                {
                  name: 'retention.ms',
                  value: '604800000', // 7 days in milliseconds
                },
              ],
            },
          ],
          waitForLeaders: false,
        })
        this.log.info(
          `Topic "${config.name}" created with ${partitionCount} partitions and ${
            config.replicationFactor || 1
          } replication factor.`,
        )
      }

      await this.waitForTopicAvailability(admin, config.name)

      // Init function should return the channel url, but in kafka
      // there is no such thing as a channel/topic url, so we just return the topic name here
      return config.name
    } catch (error) {
      this.log.error(`Failed to create topic "${config.name}":`, error)
    } finally {
      this.log.info(`Queue initialized succesfully  for "${config.name}"!`)
      await admin.disconnect()
    }
  }

  private async waitForTopicAvailability(
    admin: Admin,
    topic: string,
    retries = 5,
    delay = 1000,
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        const metadata = await admin.fetchTopicMetadata({ topics: [topic] })
        if (metadata.topics.length > 0 && metadata.topics[0].partitions.length > 0) {
          this.log.info(`Topic "${topic}" is now available.`)
          return
        }
      } catch (e) {
        this.log.trace(`Error fetching metadata for topic "${topic}":`, e)
      }

      this.log.info(`Waiting for topic "${topic}" to become available... (${i + 1}/${retries})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    throw new Error(`Topic "${topic}" did not become available within the expected time.`)
  }

  private isAvailable(maxConcurrentMessageProcessing): boolean {
    return this.processingMessages < maxConcurrentMessageProcessing
  }

  private addJob() {
    this.processingMessages++
  }

  private removeJob() {
    this.processingMessages--
  }

  public async delete(channel: IQueueChannel, options?: unknown): Promise<void> {
    // do nothing
  }

  public async setMessageVisibilityTimeout(
    channel: IQueueChannel,
    handle: string,
    newTimeout: number,
  ): Promise<void> {
    // do nothing
  }

  public async sendBulk(
    channel: IQueueChannel,
    messages: IQueueMessageBulk<IQueueMessage>[],
  ): Promise<IQueueSendBulkResult> {
    const producer = this.client.producer()
    await producer.connect()
    const result = await producer.send({
      topic: channel.name,
      messages: messages.map((m) => ({
        value: JSON.stringify(m.payload),
        key: m.groupId ?? undefined,
      })),
    })

    this.log.info({ messages, topic: channel.name }, 'Messages sent to Kafka topic!')

    await producer.disconnect()
    return result
  }
  public async start(
    processMessage: IQueueProcessMessageHandler,
    maxConcurrentMessageProcessing,
    queueConf: IKafkaChannelConfig,
    options?: IKafkaQueueStartOptions,
  ): Promise<void> {
    const MAX_RETRY_FOR_CONNECTING_CONSUMER = 5
    const RETRY_DELAY = 2000
    let retries = options?.retry || 0

    try {
      this.started = true
      this.log.info({ topic: queueConf.name }, 'Starting listening to Kafka topic...')

      const consumer = await this.getConsumer(queueConf.name)
      await consumer.connect()
      await consumer.subscribe({ topic: queueConf.name, fromBeginning: true })

      this.log.trace({ topic: queueConf.name }, 'Subscribed to topic! Starting the consmer...')
      await consumer.run({
        eachMessage: async ({ message, topic }: EachMessagePayload) => {
          if (message && message.value && this.isAvailable(maxConcurrentMessageProcessing)) {
            const now = performance.now()

            this.log.trace(
              { message: message.value.toString() },
              'Received message from Kafka topic!',
            )
            this.addJob()

            try {
              await processMessage(JSON.parse(message.value.toString()))

              const duration = performance.now() - now
              this.log.debug(`Message processed successfully in ${duration.toFixed(2)}ms!`)
            } catch (err) {
              this.log.error(err, 'Error processing message!')
              const duration = performance.now() - now
              this.log.debug(`Message processed unsuccessfully in ${duration.toFixed(2)}ms!`)
            } finally {
              this.removeJob()
            }
          } else if (
            this.isAvailable(maxConcurrentMessageProcessing) &&
            (!message || !message.value)
          ) {
            this.log.warn({ message, topic }, 'Received empty message, skipping...')
          } else {
            this.log.debug('Processor is busy, skipping message...')
          }
        },
      })
    } catch (e) {
      this.log.trace({ topic: queueConf.name, error: e }, 'Failed to start the queue!')
      if (retries < MAX_RETRY_FOR_CONNECTING_CONSUMER) {
        retries++
        this.log.trace({ topic: queueConf.name, retries }, 'Retrying to start the queue...')
        await timeout(RETRY_DELAY)
        await this.start(processMessage, maxConcurrentMessageProcessing, queueConf, {
          ...options,
          retry: retries,
        })
      } else {
        throw new Error(
          `Failed to start Kafka consumer after ${MAX_RETRY_FOR_CONNECTING_CONSUMER} retries`,
        )
      }
    }

    process.on('SIGINT', async () => {
      this.started = false
      await this.consumers.forEach((c) => c.disconnect())
      this.log.info('Kafka consumer disconnected')
      process.exit(0)
    })
  }

  public stop() {
    this.started = false
  }

  public getMessageBody(message: KafkaMessage): IQueueMessage {
    return JSON.parse(message.value.toString())
  }

  /**
   * There are no actual message ids in Kafka, we'll create one based on the message content.
   **/
  public getMessageId(message: KafkaMessage): string {
    const jsonString = JSON.stringify(message.value)

    const hash = createHash('md5').update(jsonString).digest('hex')

    return hash
  }

  /**
   * There are no receipt handles in Kafka, we'll create one based on the message offset.
   **/
  public getReceiptHandle(message: KafkaMessage): string {
    return message.offset.toString()
  }

  public getQueueChannelConfig(queue: CrowdQueue): IKafkaChannelConfig {
    return configMap[queue]
  }
}
