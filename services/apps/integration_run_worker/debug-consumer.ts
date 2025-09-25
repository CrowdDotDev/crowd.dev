import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { IQueueMessage } from '@crowd/types'

import { QUEUE_CONFIG } from './src/conf'

const log = getServiceLogger()

class DebugQueueConsumer {
  private messageCount = 0
  private startTime = Date.now()

  constructor(
    private readonly queueClient: any,
    private readonly customGroupId: string = 'debug-consumer-group',
  ) {}

  async start() {
    log.info(`Starting debug consumer with group ID: ${this.customGroupId}`)
    log.info('This consumer will inspect messages without affecting the main consumer group')

    try {
      // Get the Kafka client directly to create a consumer with custom group ID
      const kafkaClient = this.queueClient.getClient()
      const consumer = kafkaClient.consumer({
        groupId: this.customGroupId,
        sessionTimeout: 30000,
        rebalanceTimeout: 60000,
        heartbeatInterval: 3000,
      })

      // Add event listeners for debugging
      consumer.on(consumer.events.GROUP_JOIN, () => {
        log.info('Debug consumer joined the group')
      })

      consumer.on(consumer.events.REBALANCING, () => {
        log.info('Debug consumer group is rebalancing')
      })

      consumer.on(consumer.events.COMMIT_OFFSETS, (event) => {
        log.info(`Debug consumer committed offsets: ${JSON.stringify(event, null, 2)}`)
      })

      consumer.on(consumer.events.CRASH, (event) => {
        log.error({ error: event.payload.error }, 'Debug consumer crashed')
      })

      await consumer.connect()
      log.info('Debug consumer connected!')

      // Subscribe to the integration run worker topic
      const topicName = 'integration-run-worker-high-production'
      await consumer.subscribe({ topic: topicName })
      log.info(`Debug consumer subscribed to topic: ${topicName}`)

      await consumer.run({
        autoCommitInterval: 10000, // 10 seconds
        eachMessage: async ({ message, partition, topic }) => {
          this.messageCount++
          const timeSinceStart = ((Date.now() - this.startTime) / 1000).toFixed(1)

          log.info(
            {
              messageCount: this.messageCount,
              timeSinceStart: `${timeSinceStart}s`,
              partition,
              topic,
              offset: message.offset,
              timestamp: message.timestamp,
              key: message.key?.toString(),
            },
            '📨 DEBUG: Received message',
          )

          try {
            if (message.value) {
              const data: IQueueMessage = JSON.parse(message.value.toString())

              log.info(
                {
                  messageType: data.type,
                  messageId: (data as any).id,
                  messageData: JSON.stringify(data, null, 2),
                },
                '📋 DEBUG: Message content',
              )

              // Simulate processing time to see if we can process successfully
              await new Promise((resolve) => setTimeout(resolve, 100))

              log.info(
                {
                  messageType: data.type,
                  processingTime: '100ms',
                },
                '✅ DEBUG: Message processed successfully',
              )
            }
          } catch (err) {
            log.error(err, '❌ DEBUG: Error processing message')
          }
        },
      })
    } catch (error) {
      log.error(error, 'Failed to start debug consumer')
      throw error
    }
  }

  async stop() {
    log.info('Stopping debug consumer...')
    // Consumer cleanup will be handled by the Kafka client
  }
}

// Main execution
async function main() {
  log.info('🔍 Starting Kafka Debug Consumer')
  log.info('This script will consume messages from integration-run-worker-high-production topic')
  log.info('with a separate consumer group to inspect what messages are available')

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())

  // Allow custom group ID via environment variable
  const customGroupId = process.env.DEBUG_GROUP_ID || `debug-consumer-${Date.now()}`

  const debugConsumer = new DebugQueueConsumer(queueClient, customGroupId)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    log.info('Received SIGINT, shutting down gracefully...')
    await debugConsumer.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    log.info('Received SIGTERM, shutting down gracefully...')
    await debugConsumer.stop()
    process.exit(0)
  })

  try {
    await debugConsumer.start()
  } catch (error) {
    log.error(error, 'Debug consumer failed to start')
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export default DebugQueueConsumer
