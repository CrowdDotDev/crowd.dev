import fs from 'fs'
import os from 'os'
import path from 'path'

import { distinct } from '@crowd/common'
import { getServiceLogger } from '@crowd/logging'
import { KafkaAdmin, QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'

const log = getServiceLogger()

setImmediate(async () => {
  try {
    ensureOciConfig()
  } catch (err) {
    log.error(err, 'Failed to ensure OCI config!')
    throw err
  }

  const streams = await getAllStreams()

  for (const stream of streams) {
    log.info(`Found stream ${stream.name}!`)
  }

  const kafkaClient = getKafkaClient(QUEUE_CONFIG())
  const admin = kafkaClient.admin()
  await admin.connect()

  // const topic = 'data-sink-worker-normal-production'
  // const group = 'data-sink-worker-normal-production'

  // console.log(await isConsumerListeningToTopic(admin, group, topic))

  const map = await getTopicsAndConsumerGroups(admin)
  console.log(map)
})

async function getTopicsAndConsumerGroups(admin: KafkaAdmin) {
  const topics = await admin.listTopics()
  const groupsResponse = await admin.listGroups()
  const consumerGroups = distinct(groupsResponse.groups.map((g) => g.groupId))

  for (const group of consumerGroups) {
    log.info(`Group ${group}!`)
  }

  const topicConsumerMap = new Map<string, string[]>()

  for (const topic of topics) {
    log.info(`Checking topic ${topic} consumer groups!`)
    const consumers = []
    for (const group of consumerGroups) {
      log.debug(`Checking group ${group} if it is listening to topic ${topic}!`)
      if (await isConsumerListeningToTopic(admin, group, topic)) {
        log.info(`Group ${group} is listening to topic ${topic}!`)
        consumers.push(group)
      }
    }
    topicConsumerMap.set(topic, consumers)
  }

  return topicConsumerMap
}

async function isConsumerListeningToTopic(
  admin: KafkaAdmin,
  groupId: string,
  topic: string,
): Promise<boolean> {
  try {
    // Method 1: Check subscriptions via group description (most accurate)
    try {
      const groupDetails = await admin.describeGroups([groupId])

      // Skip empty or Dead groups
      if (!groupDetails.groups[0] || groupDetails.groups[0].state === 'Dead') {
        log.debug(`Group ${groupId} is dead!`)
        return false
      }

      // Check if any member is subscribed to the topic
      for (const member of groupDetails.groups[0].members) {
        if (member.memberMetadata) {
          try {
            // Parse member metadata which contains subscription info
            const metadata = JSON.parse(member.memberMetadata.toString())

            // Check if topic is in the subscription list
            if (metadata.subscription && Array.isArray(metadata.subscription)) {
              if (metadata.subscription.includes(topic)) {
                log.debug(`Group ${groupId} is listening to topic ${topic}!`)
                return true
              }
            }
          } catch (metadataErr) {
            // Failed to parse metadata, try alternative approach
          }
        }
      }
    } catch (describeErr) {
      // Group might not exist or other error occurred
      // Fall through to alternative method
      log.error(describeErr, `Error describing group ${groupId}`)
    }

    // Method 2: Check committed offsets (less accurate but works as fallback)
    try {
      const offsetsResponse = await admin.fetchOffsets({
        groupId: groupId,
        topics: [topic],
      })

      // No data returned
      if (offsetsResponse.length === 0 || !offsetsResponse[0].partitions) {
        log.debug(`Group ${groupId} is not listening to topic ${topic}!`)
        return false
      }

      // Check if any partition has a valid offset
      const hasConsumedPartitions = offsetsResponse[0].partitions.some((partition) => {
        // An offset of -1 means the consumer has never committed an offset
        // Any other value means it has consumed from this topic
        log.debug(
          `Group ${groupId} Partition ${partition.partition} has offset ${partition.offset}!`,
        )
        return partition.offset !== '-1'
      })

      return hasConsumedPartitions
    } catch (offsetErr) {
      // Likely means this consumer doesn't consume this topic
      log.error(offsetErr, `Group ${groupId} is not listening to topic ${topic}!`)
      return false
    }
  } catch (error) {
    // Log the error but don't crash the application
    log.error(error, `Error checking if group ${groupId} listens to topic ${topic}`)
    return false
  }
}

function ensureOciConfig() {
  const homeDir = os.homedir()
  const ociDir = path.join(homeDir, '.oci')
  const configPath = path.join(ociDir, 'config')

  if (fs.existsSync(configPath)) {
    return
  }

  const keyPath = path.join(ociDir, 'private.pem')

  const user = process.env.CROWD_KAFKA_USER_OCID
  const keyFingerprint = process.env.CROWD_KAFKA_KEY_FINGERPRINT
  const tenant = process.env.CROWD_KAFKA_TENANCY_OCID
  const region = process.env.CROWD_KAFKA_REGION
  const keyBase64 = process.env.CROWD_KAFKA_KEY
  const compartmentId = process.env.CROWD_KAFKA_COMPARMENT_OCID

  if (!user || !keyFingerprint || !tenant || !region || !keyBase64 || !compartmentId) {
    throw new Error('Missing required environment variables')
  }

  const privateKey = Buffer.from(keyBase64, 'base64').toString('ascii')

  // prepare oracle config
  const config = `
      [DEFAULT]
      user=${user}
      fingerprint=${keyFingerprint}
      key_file=${keyPath}
      tenancy=${tenant}
      region=${region}
      `

  // create the ~/.oci folder if it doesn't exists
  fs.mkdirSync(ociDir, { recursive: true })

  // write config to ~/.oci/config
  fs.writeFileSync(configPath, config, 'utf8')

  // write private key to ~/.oci/oci_api_key.pem
  fs.writeFileSync(keyPath, privateKey, 'utf8')

  // chmod 600 to key and config
  fs.chmodSync(configPath, 0o600)
  fs.chmodSync(keyPath, 0o600)
}

async function getAllStreams() {
  const commonModule = await import('oci-common')
  const stModule = await import('oci-streaming')

  const common = commonModule.default
  const st = stModule.default

  const provider = new common.ConfigFileAuthenticationDetailsProvider()

  const streamAdminClient = new st.StreamAdminClient({
    authenticationDetailsProvider: provider,
  })

  const streams: IStream[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listStreamsRequest: any = {
    compartmentId: process.env.CROWD_KAFKA_COMPARMENT_OCID,
    lifecycleState: st.models.StreamSummary.LifecycleState.Active,
    limit: 50,
  }

  const records = await common.paginatedRecordsWithLimit(listStreamsRequest, (req) =>
    streamAdminClient.listStreams(req),
  )

  for (let i = 0; i < records.length; i++) {
    const stream = records[i].value
    streams.push({
      name: stream.name,
      id: stream.id,
    })
  }

  return streams
}

interface IStream {
  name: string
  id: string
}
