/**
 * Minimal Kafka Debug Script
 *
 * Just connects to Kafka directly and shows basic info about the topic
 *
 * Usage: npx tsx minimal-kafka-debug.ts
 */
import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'

async function main() {
  console.log('🔍 Minimal Kafka Debug Script')
  console.log('============================')

  const config = QUEUE_CONFIG()
  console.log('📋 Kafka Config:')
  console.log(`   Brokers: ${config.brokers}`)
  console.log(`   Client ID: ${config.clientId}`)
  console.log(`   Extra config: ${config.extra ? 'present' : 'none'}`)
  console.log('')

  // Use the same getKafkaClient method as the queue service
  const kafka = getKafkaClient(config)

  const admin = kafka.admin()
  const topicName = 'integration-run-worker-high-production'
  const debugGroupId = `minimal-debug-${Date.now()}`

  try {
    await admin.connect()
    console.log('✅ Connected to Kafka cluster')

    // Check if topic exists
    const topics = await admin.listTopics()
    console.log(`📋 Available topics: ${topics.length}`)

    if (topics.includes(topicName)) {
      console.log(`✅ Topic '${topicName}' exists`)

      // Get topic metadata
      const metadata = await admin.fetchTopicMetadata({ topics: [topicName] })
      const topicMeta = metadata.topics[0]
      console.log(`📊 Partitions: ${topicMeta.partitions.length}`)

      // Get topic offsets
      const offsets = await admin.fetchTopicOffsets(topicName)
      console.log('📈 Topic offsets:')
      offsets.forEach((partition) => {
        console.log(
          `   Partition ${partition.partition}: ${partition.low} - ${partition.high} (${parseInt(partition.high) - parseInt(partition.low)} messages)`,
        )
      })

      // Check consumer groups
      const groups = await admin.listGroups()
      const integrationGroups = groups.groups.filter((g) =>
        g.groupId.includes('integration-run-worker'),
      )
      console.log(`👥 Integration run worker related groups: ${integrationGroups.length}`)
      integrationGroups.forEach((group) => {
        console.log(`   - ${group.groupId} (${group.protocolType})`)
      })
    } else {
      console.log(`❌ Topic '${topicName}' does not exist`)
    }

    await admin.disconnect()
    console.log('')
    console.log('🚀 To consume messages, run:')
    console.log(`   DEBUG_GROUP_ID=${debugGroupId} npx tsx direct-kafka-debug.ts`)
  } catch (error) {
    console.error('💥 Error:', error)
    process.exit(1)
  }
}

main().catch(console.error)
