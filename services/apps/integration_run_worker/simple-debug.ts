/**
 * Simple Debug Consumer for Integration Run Worker
 *
 * Usage:
 *   cd services/apps/integration_run_worker
 *   npx tsx simple-debug.ts
 *
 * Or with custom group ID:
 *   DEBUG_GROUP_ID=my-test-group npx tsx simple-debug.ts
 *
 * This script will:
 * - Create a new consumer group (won't interfere with the main worker)
 * - Read messages from integration-run-worker-high-production topic
 * - Show message content and processing status
 * - Start from the earliest unread messages for this consumer group
 */
import { getServiceLogger } from '@crowd/logging'
import { QueueFactory } from '@crowd/queue'
import { IQueueMessage } from '@crowd/types'

import { QUEUE_CONFIG } from './src/conf'

const log = getServiceLogger()

async function startDebugConsumer() {
  const customGroupId = process.env.DEBUG_GROUP_ID || `debug-consumer-${Date.now()}`

  log.info('🔍 Starting Kafka Debug Consumer')
  log.info(`📋 Consumer Group ID: ${customGroupId}`)
  log.info('📨 Topic: integration-run-worker-high-production')
  log.info('🎯 This consumer will NOT interfere with the main worker')
  log.info('💡 Press Ctrl+C to stop')
  log.info('---')

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const kafkaClient = queueClient.getClient()

  const consumer = kafkaClient.consumer({
    groupId: customGroupId,
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
  })

  // Event listeners
  consumer.on(consumer.events.GROUP_JOIN, () => {
    log.info('✅ Consumer joined the group')
  })

  consumer.on(consumer.events.COMMIT_OFFSETS, (event) => {
    log.debug(`📝 Committed offsets for ${event.payload.groupId}`)
  })

  consumer.on(consumer.events.CRASH, (event) => {
    log.error(event.payload.error, '💥 Consumer crashed')
  })

  let messageCount = 0
  const startTime = Date.now()

  try {
    await consumer.connect()
    log.info('🔌 Connected to Kafka')

    await consumer.subscribe({
      topic: 'integration-run-worker-high-production',
    })
    log.info('📡 Subscribed to topic')

    await consumer.run({
      autoCommitInterval: 5000, // Commit every 5 seconds
      eachMessage: async ({ message, partition, topic }) => {
        messageCount++
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

        try {
          const data: IQueueMessage = JSON.parse(message.value.toString())

          log.info(
            {
              count: messageCount,
              elapsed: `${elapsed}s`,
              partition,
              offset: message.offset,
              type: data.type,
              timestamp: new Date(parseInt(message.timestamp)).toISOString(),
            },
            `📨 Message #${messageCount}`,
          )

          // Log the full message content
          console.log('📋 Full message content:')
          console.log(JSON.stringify(data, null, 2))
          console.log('---')

          // Simulate processing
          await new Promise((resolve) => setTimeout(resolve, 50))
        } catch (err) {
          log.error(err, `❌ Error processing message #${messageCount}`)
          console.log('Raw message value:', message.value?.toString())
        }
      },
    })
  } catch (error) {
    log.error(error, '💥 Failed to start consumer')
    process.exit(1)
  }

  // Graceful shutdown
  const shutdown = async () => {
    log.info('🛑 Shutting down...')
    await consumer.disconnect()
    log.info(`📊 Processed ${messageCount} messages total`)
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

// Start the consumer
startDebugConsumer().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
