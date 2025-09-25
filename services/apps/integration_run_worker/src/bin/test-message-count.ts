import { getServiceLogger } from '@crowd/logging'
import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'
import { KafkaQueueService } from '@crowd/queue/src/vendors/kafka/client'

// Test script to verify the getQueueMessageCount fix
// This will help debug the message count calculation

const log = getServiceLogger()
const kafka = getKafkaClient(QUEUE_CONFIG())
const queueService = new KafkaQueueService(kafka, log)

// Test the message count for the high priority topic
const testConfig = {
  name: 'integration-run-worker-high-production',
  replicationFactor: 1,
  partitions: {
    default: 1,
    high: 5,
    normal: 1,
    system: 1,
  },
}

async function testMessageCount() {
  console.log('🔍 Testing message count calculation...')
  console.log('Topic:', testConfig.name)
  console.log('Brokers:', process.env.CROWD_KAFKA_BROKERS)
  console.log('')

  try {
    const count = await queueService.getQueueMessageCount(testConfig)
    console.log(`✅ Message count: ${count}`)

    if (count === 0) {
      console.log('🎉 No messages left - consumer is up to date!')
    } else {
      console.log(`⚠️  ${count} messages are still pending`)
    }
  } catch (error) {
    console.error('❌ Error getting message count:', error)
  }
}

setImmediate(async () => {
  await testMessageCount()
})
