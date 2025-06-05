import CronTime from 'cron-time-generator'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { IS_PROD_ENV, distinct } from '@crowd/common'
import { Logger } from '@crowd/logging'
import { KafkaAdmin, QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'
import { REDIS_CONFIG, RedisCache, getRedisClient } from '@crowd/redis'
import telemetry from '@crowd/telemetry'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'queue-monitoring',
  cronTime: CronTime.everyHour(),
  timeout: 30 * 60,
  enabled: async () => IS_PROD_ENV,
  process: async (ctx) => {
    try {
      ensureOciConfig()
    } catch (err) {
      ctx.log.error(err, 'Failed to ensure OCI config!')
      throw err
    }

    const allStreams = await getAllStreams()

    const toIgnore = (
      process.env.CROWD_KAFKA_STREAMS_TO_IGNORE_ON_MONITORING?.split(',') ?? []
    ).map((s) => s.trim())

    ctx.log.info(`To ignore: ${toIgnore.join(', ')}`)

    const streams: IStream[] = []
    for (const stream of allStreams) {
      ctx.log.debug(`Found stream ${stream.name}!`)
      if (!toIgnore.includes(stream.name.trim())) {
        streams.push(stream)
      } else {
        ctx.log.info(`Ignoring stream ${stream.name}!`)
      }
    }

    const kafkaClient = getKafkaClient(QUEUE_CONFIG())
    const admin = kafkaClient.admin()
    await admin.connect()

    const map = await getTopicsAndConsumerGroups(ctx.log, admin)

    let msg = ``

    for (const [topic, groups] of map) {
      const totalMessages = await getTopicMessageCount(ctx.log, admin, topic)
      telemetry.gauge(`kafka.${topic}.total`, totalMessages)

      if (groups.length === 0) {
        msg += `No consumer groups found for topic ${topic}! Total messages in topic: ${totalMessages}\n`
        continue
      }

      for (const group of groups) {
        const counts = await getMessageCounts(ctx.log, admin, topic, group)
        ctx.log.info(
          `Topic ${topic} group ${group} has ${counts.total} total messages, ${counts.consumed} consumed, ${counts.unconsumed} unconsumed!`,
        )

        telemetry.gauge(`kafka.${topic}.${group}.consumed`, counts.consumed)
        telemetry.gauge(`kafka.${topic}.${group}.unconsumed`, counts.unconsumed)
      }
    }

    if (msg && msg.trim().length > 0) {
      ctx.log.info({ slackQueueMonitoringNotify: true }, msg)
    }
  },
}

async function getTopicsAndConsumerGroups(
  log: Logger,
  admin: KafkaAdmin,
): Promise<Map<string, string[]>> {
  const topics = await admin.listTopics()

  const redis = await getRedisClient(REDIS_CONFIG())
  const cache = new RedisCache('queueMonitor', redis, log)

  const topicConsumerMap = new Map<string, string[]>()

  for (const topic of topics) {
    const consumers = await cache.get(topic)
    if (consumers) {
      topicConsumerMap.set(topic, JSON.parse(consumers))
    }
  }

  const groupsResponse = await admin.listGroups()
  const consumerGroups = distinct(groupsResponse.groups.map((g) => g.groupId))

  for (const topic of topics) {
    if (topicConsumerMap.has(topic)) {
      continue
    }

    log.debug(`Checking topic ${topic} consumer groups!`)
    const consumers = []
    for (const group of consumerGroups) {
      log.debug(`Checking group ${group} if it is listening to topic ${topic}!`)
      if (await isConsumerListeningToTopic(log, admin, group, topic)) {
        log.debug(`Group ${group} is listening to topic ${topic}!`)
        consumers.push(group)
      }
    }
    topicConsumerMap.set(topic, consumers)
    // save to cache for 24 hours
    await cache.set(topic, JSON.stringify(consumers), 24 * 60 * 60)
  }

  return topicConsumerMap
}

async function isConsumerListeningToTopic(
  log: Logger,
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
            // log.error(
            //   metadataErr,
            //   `Failed to parse metadata for group ${groupId}! - "${member.memberMetadata.toString()}"`,
            // )
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
  const compartmentId = process.env.CROWD_KAFKA_COMPARTMENT_OCID

  if (!user) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_USER_OCID')
  }

  if (!keyFingerprint) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_KEY_FINGERPRINT')
  }

  if (!tenant) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_TENANCY_OCID')
  }

  if (!region) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_REGION')
  }

  if (!keyBase64) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_KEY')
  }

  if (!compartmentId) {
    throw new Error('Missing required environment variables - CROWD_KAFKA_COMPARTMENT_OCID')
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
    compartmentId: process.env.CROWD_KAFKA_COMPARTMENT_OCID,
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

async function getMessageCounts(
  log: Logger,
  admin: KafkaAdmin,
  topic: string,
  groupId: string,
): Promise<{
  total: number
  consumed: number
  unconsumed: number
}> {
  try {
    const topicOffsets = await admin.fetchTopicOffsets(topic)
    const offsetsResponse = await admin.fetchOffsets({
      groupId: groupId,
      topics: [topic],
    })

    const offsets = offsetsResponse[0].partitions

    let totalMessages = 0
    let consumedMessages = 0
    let totalLeft = 0

    for (const offset of offsets) {
      const topicOffset = topicOffsets.find((p) => p.partition === offset.partition)
      if (topicOffset) {
        // Total messages is the latest offset
        totalMessages += Number(topicOffset.offset)
        // Consumed messages is the consumer group's offset
        consumedMessages += Number(offset.offset)
        // Unconsumed is the difference
        totalLeft += Number(topicOffset.offset) - Number(offset.offset)
      }
    }

    return {
      total: totalMessages,
      consumed: consumedMessages,
      unconsumed: totalLeft,
    }
  } catch (err) {
    log.error(err, 'Failed to get message count!')
    throw err
  }
}

async function getTopicMessageCount(
  log: Logger,
  admin: KafkaAdmin,
  topic: string,
): Promise<number> {
  try {
    const topicOffsets = await admin.fetchTopicOffsets(topic)

    // Sum up all partition offsets to get total messages
    const totalMessages = topicOffsets.reduce((sum, partition) => {
      return sum + Number(partition.offset)
    }, 0)

    return totalMessages
  } catch (err) {
    log.error(err, `Failed to get message count for topic ${topic}!`)
    throw err
  }
}

interface IStream {
  name: string
  id: string
}

export default job
