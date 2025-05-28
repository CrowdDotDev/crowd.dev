import CronTime from 'cron-time-generator'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'queue-monitoring',
  cronTime: CronTime.every(1).minutes(),
  timeout: 5 * 60,
  enabled: async () => true, // IS_PROD_ENV,
  process: async (ctx) => {
    try {
      ensureOciConfig()
    } catch (err) {
      ctx.log.error(err, 'Failed to ensure OCI config!')
      throw err
    }

    const streams = await getAllStreams()

    for (const stream of streams) {
      ctx.log.info(`Found stream ${stream.name}!`)
    }

    const kafkaClient = getKafkaClient(QUEUE_CONFIG())
    const admin = kafkaClient.admin()
    await admin.connect()

    const groupsResponse = await admin.listGroups()
    const consumerGroups = groupsResponse.groups

    for (const group of consumerGroups) {
      ctx.log.info(`Found group ${group.groupId}!`)
    }

    for (const stream of streams) {
      ctx.log.info(`Stream ${stream.name} (${stream.id})`)

      const topicOffsets = await admin.fetchTopicOffsets(stream.name)

      for (const group of consumerGroups) {
        const offsetsResponse = await admin.fetchOffsets({
          groupId: group.groupId,
          topics: [stream.name],
        })

        if (
          offsetsResponse.length === 0 ||
          offsetsResponse[0].topic !== stream.name ||
          offsetsResponse[0].partitions.length === 0
        ) {
          continue
        }

        let totalLeft = 0
        for (const offset of offsetsResponse[0].partitions) {
          const topicOffset = topicOffsets.find((p) => p.partition === offset.partition)
          if (topicOffset.offset !== offset.offset) {
            totalLeft += Number(topicOffset.offset) - Number(offset.offset)
          }
        }

        ctx.log.info(
          `Group ${group.groupId} has ${totalLeft} messages left to process in topic ${stream.name}!`,
        )
      }
    }
  },
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

export default job
