/**
 * Direct Kafka Debug Consumer
 *
 * This script connects directly to Kafka without using the queue service layer
 * to inspect messages in the integration-run-worker-high-production topic
 *
 * Usage:
 *   cd services/apps/integration_run_worker
 *   npx tsx direct-kafka-debug.ts
 *
 * Or with custom group ID:
 *   DEBUG_GROUP_ID=my-test-group npx tsx direct-kafka-debug.ts
 */
import { getServiceLogger } from '@crowd/logging'
import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'

const log = getServiceLogger()

async function startDirectKafkaDebug() {
  const customGroupId = process.env.DEBUG_GROUP_ID || `direct-debug-${Date.now()}`
  const topicName = 'integration-run-worker-high-production'

  log.info('🔍 Starting Direct Kafka Debug Consumer')
  log.info(`📋 Consumer Group ID: ${customGroupId}`)
  log.info(`📨 Topic: ${topicName}`)
  log.info('🎯 This is a direct Kafka consumer (bypassing queue service)')
  log.info('💡 Press Ctrl+C to stop')
  log.info('---')

  try {
    // Use the same getKafkaClient method as the queue service
    const kafka = getKafkaClient(QUEUE_CONFIG())
    const consumer = kafka.consumer({
      groupId: customGroupId,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000,
      heartbeatInterval: 3000,
    })

    // Event listeners for debugging
    consumer.on('consumer.group_join', (event) => {
      log.info({ groupId: event.payload.groupId }, '✅ Joined consumer group')
    })

    consumer.on('consumer.rebalancing', () => {
      log.info('🔄 Consumer group rebalancing')
    })

    consumer.on('consumer.commit_offsets', (event) => {
      log.info(
        {
          groupId: event.payload.groupId,
          offsets: event.payload.topics,
        },
        '📝 Committed offsets',
      )
    })

    consumer.on('consumer.crash', (event) => {
      log.error({ error: event.payload.error }, '💥 Consumer crashed')
    })

    consumer.on('consumer.disconnect', () => {
      log.warn('🔌 Consumer disconnected')
    })

    let messageCount = 0
    const startTime = Date.now()

    await consumer.connect()
    log.info('🔌 Connected to Kafka cluster')

    await consumer.subscribe({
      topic: topicName,
      fromBeginning: true, // Read from beginning to see existing messages
    })
    log.info(`📡 Subscribed to topic: ${topicName}`)

    // Add timeout to detect if no messages are received
    let lastMessageTime = Date.now()
    const messageTimeout = setInterval(() => {
      if (Date.now() - lastMessageTime > 10000) {
        // 10 seconds
        log.warn(`⏰ No messages received for 10 seconds. Total processed: ${messageCount}`)
        lastMessageTime = Date.now()
      }
    }, 10000)

    await consumer.run({
      autoCommitInterval: 5000,
      eachMessage: async ({ topic, partition, message }) => {
        messageCount++
        lastMessageTime = Date.now()
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

        try {
          log.info(
            {
              count: messageCount,
              elapsed: `${elapsed}s`,
              topic,
              partition,
              offset: message.offset,
              timestamp: message.timestamp
                ? new Date(parseInt(message.timestamp)).toISOString()
                : 'unknown',
              key: message.key?.toString() || 'no-key',
              valueSize: message.value?.length || 0,
            },
            `📨 Message #${messageCount}`,
          )

          if (message.value) {
            try {
              const data = JSON.parse(message.value.toString())

              log.info(
                {
                  messageType: data.type,
                  messageId: data.id || 'no-id',
                },
                '📋 Parsed message content',
              )

              // Pretty print the message
              console.log('📄 Full message data:')
              console.log(JSON.stringify(data, null, 2))
              console.log('---')

              // Simulate some processing time
              await new Promise((resolve) => setTimeout(resolve, 100))

              log.info({ messageType: data.type }, '✅ Message processed successfully')
            } catch (parseError) {
              log.error({ parseError }, '❌ Failed to parse message as JSON')
              console.log('Raw message value:', message.value.toString())
            }
          } else {
            log.warn('⚠️ Message has no value')
          }
        } catch (err) {
          log.error(err, `❌ Error processing message #${messageCount}`)
        }
      },
    })
  } catch (error) {
    log.error(error, '💥 Failed to start direct Kafka consumer')
    if (messageTimeout) {
      clearInterval(messageTimeout)
    }
    process.exit(1)
  }
}

// Graceful shutdown handler
async function shutdown(consumer?: { disconnect: () => Promise<void> }) {
  log.info('🛑 Shutting down direct Kafka consumer...')
  try {
    if (consumer) {
      await consumer.disconnect()
    }
    log.info('👋 Disconnected successfully')
  } catch (err) {
    log.error(err, 'Error during shutdown')
  }
  process.exit(0)
}

// Signal handlers
process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

// Start the consumer
startDirectKafkaDebug().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
