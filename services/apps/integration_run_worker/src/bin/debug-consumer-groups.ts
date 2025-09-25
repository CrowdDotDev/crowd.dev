import { getServiceLogger } from '@crowd/logging'
import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'

// Debug script to check what consumer groups exist and their offsets
const log = getServiceLogger()
const kafka = getKafkaClient(QUEUE_CONFIG())

async function debugConsumerGroups() {
  console.log('🔍 Debugging Consumer Groups and Offsets...')
  console.log('Brokers:', process.env.CROWD_KAFKA_BROKERS)
  console.log('')

  const admin = kafka.admin()

  try {
    await admin.connect()
    console.log('✅ Connected to Kafka admin')

    // List all consumer groups
    const groups = await admin.listGroups()
    console.log('\n📋 All Consumer Groups:')
    groups.groups.forEach((group) => {
      console.log(`  - ${group.groupId} (${group.protocolType})`)
    })

    // Check specific topic
    const topic = 'integration-run-worker-high-production'
    console.log(`\n📊 Topic: ${topic}`)

    // Get topic offsets
    const topicOffsets = await admin.fetchTopicOffsets(topic)
    console.log('Topic offsets:')
    topicOffsets.forEach((offset) => {
      console.log(`  Partition ${offset.partition}: ${offset.offset} (high), ${offset.low} (low)`)
    })

    // Check consumer group offsets for the topic
    const consumerGroupId = 'integration-run-worker-high-production'
    console.log(`\n🔍 Consumer Group: ${consumerGroupId}`)

    try {
      const groupOffsets = await admin.fetchOffsets({
        groupId: consumerGroupId,
        topics: [topic],
      })

      if (groupOffsets.length > 0) {
        console.log('Consumer group offsets:')
        groupOffsets[0].partitions.forEach((partition) => {
          console.log(`  Partition ${partition.partition}: ${partition.offset}`)
        })

        // Calculate lag
        let totalLag = 0
        topicOffsets.forEach((topicOffset) => {
          const groupPartition = groupOffsets[0].partitions.find(
            (p) => p.partition === topicOffset.partition,
          )
          if (groupPartition) {
            const lag = Number(topicOffset.offset) - Number(groupPartition.offset)
            totalLag += lag
            console.log(`  Partition ${topicOffset.partition} lag: ${lag}`)
          }
        })
        console.log(`\n📈 Total lag: ${totalLag} messages`)
      } else {
        console.log('❌ No consumer group offsets found')
      }
    } catch (err) {
      console.log(`❌ Error fetching consumer group offsets: ${err.message}`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await admin.disconnect()
  }
}

setImmediate(async () => {
  await debugConsumerGroups()
})
