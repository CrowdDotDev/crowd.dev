/* eslint-disable @typescript-eslint/no-unused-vars */
import { Consumer, EachMessagePayload, Kafka, KafkaMessage } from 'kafkajs'
import {
  CrowdQueue,
  IQueue,
  IQueueChannel,
  IQueueProcessMessageHandler,
  IQueueReceiveResponse,
  IQueueSendBulkResult,
  IQueueSendResult,
} from '../../types'
import { IKafkaConfig } from './types'
import { Logger, LoggerBase } from '@crowd/logging'
import { IQueueMessage, IQueueMessageBulk } from '@crowd/types'
import { createHash } from 'crypto'
import { configMap } from './config'

export class KafkaQueueService extends LoggerBase implements IQueue {
  private consumer: Consumer
  private processingMessages: number
  private started: boolean

  public constructor(public readonly client: Kafka, parentLog: Logger) {
    super(parentLog, {
      service: 'kafka-queue',
    })
    this.processingMessages = 0
    this.started = false
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

    this.log.info({ message: message, topic: channel.name }, 'Message sent to Kafka topic!')

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
          this.consumer = null
        },
      })
    })
  }

  private async getConsumer(groupId: string): Promise<Consumer> {
    if (!this.consumer) {
      this.consumer = this.client.consumer({ groupId })
      await this.consumer.connect()
    }
    return this.consumer
  }

  public getClient() {
    return this.client
  }

  public async init(config: IKafkaConfig): Promise<string> {
    this.log.trace({ config }, 'Initializing queue!')

    const admin = this.client.admin()
    await admin.connect()

    try {
      const existingTopics = await admin.listTopics()
      if (!existingTopics.includes(config.name)) {
        await admin.createTopics({
          topics: [
            {
              topic: config.name,
              numPartitions: config.partitionCount,
            },
          ],
        })
        this.log.info(`Topic "${config.name}" created with ${config.partitionCount} partitions.`)
      }

      // Init function should return the channel url, but in kafka
      // there is no such thing as a channel/topic url, so we just return the topic name here
      return config.name
    } catch (error) {
      this.log.error(`Failed to create topic "${config.name}":`, error)
    } finally {
      await admin.disconnect()
    }
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
    queueConf: IKafkaConfig,
  ): Promise<void> {
    await this.init(queueConf)

    this.started = true
    this.log.info({ topic: queueConf.name }, 'Starting listening to Kafka topic...')

    const consumer = await this.getConsumer(queueConf.name)
    await consumer.connect()
    await consumer.subscribe({ topic: queueConf.name, fromBeginning: true })

    await consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (this.isAvailable(maxConcurrentMessageProcessing)) {
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
        } else {
          this.log.debug('Processor is busy, skipping message...')
        }
      },
    })

    process.on('SIGINT', async () => {
      this.started = false
      await consumer.disconnect()
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

  public getQueueConfig(queue: CrowdQueue): IKafkaConfig {
    return configMap[queue]
  }
}
