import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ParquetReader } from '@dsnp/parquetjs'
import CronTime from 'cron-time-generator'

import { DataSinkWorkerEmitter } from '@crowd/common_services'
import { QUEUE_CONFIG, getKafkaClient } from '@crowd/queue'
import { KafkaQueueService } from '@crowd/queue/src/vendors/kafka/client'
import { REDIS_CONFIG, RedisCache, getRedisClient } from '@crowd/redis'
import { SnowflakeClient } from '@crowd/snowflake'
import { IActivityData, IMemberData, MemberIdentityType, PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

const S3_BUCKET = 'cdp-snowflake-connectors-stg'
const S3_BUCKET_PATH = `s3://${S3_BUCKET}/raw-data`
const S3_PREFIX = 'raw-data'
const STORAGE_INTEGRATION = 'CDP_S3_EXPORT_INTEGRATION'
const TABLE_NAME = 'event_registrations'
const BATCH_SIZE = parseInt(process.env.CROWD_SNOWFLAKE_EXPORT_BATCH_SIZE || '10000', 10)

// Hardcoded POC values
const POC_SEGMENT_ID = 'd21a390f-33b4-43e9-9502-fd335f6a6bee' // pytorch segment on staging
const POC_INTEGRATION_ID = 'f809e74d-52e4-4206-88c2-fa29433ac851' // lfid integration on staging

const TIMESTAMP_TZ_COLUMNS = [
  'EVENT_START_DATE',
  'EVENT_END_DATE',
  'EVENT_CREATED_TS',
  'EVENT_UPDATED_AT',
  'REGISTRATION_TS',
  'REGISTRATION_CREATED_TS',
  'EVENT_REGISTRATION_UPDATED_AT',
  'PURCHASE_TS',
  'UPDATED_TS',
]

const buildSourceQuery = (s3ExportLastRunTimestamp?: string) => {
  const excludeClause = TIMESTAMP_TZ_COLUMNS.join(', ')
  const castClauses = TIMESTAMP_TZ_COLUMNS.map((col) => `r.${col}::TIMESTAMP_NTZ AS ${col}`).join(
    ', ',
  )

  let query = `SELECT r.* EXCLUDE (${excludeClause}), ${castClauses} FROM ANALYTICS.SILVER_FACT.EVENT_REGISTRATIONS r`

  if (s3ExportLastRunTimestamp) {
    query += ` WHERE r.UPDATED_TS > '${s3ExportLastRunTimestamp}'`
  }

  return query
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRowToActivity(row: Record<string, any>): IActivityData | null {
  const userName = (row.USER_NAME as string | null)?.trim() || null
  const fullName = (row.FULL_NAME as string | null)?.trim() || null
  const firstName = (row.FIRST_NAME as string | null)?.trim() || null
  const lastName = (row.LAST_NAME as string | null)?.trim() || null
  const email = (row.EMAIL as string)?.trim()
  const registrationId = (row.REGISTRATION_ID as string)?.trim()

  const displayName =
    fullName ||
    (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName) ||
    userName

  const identities: IMemberData['identities'] = []
  const sourceId = (row.USER_ID as string | null) || undefined

  if (userName) {
    identities.push(
      {
        platform: PlatformType.LFID,
        value: email,
        type: MemberIdentityType.EMAIL,
        verified: true,
        sourceId,
      },
      {
        platform: PlatformType.LFID,
        value: userName,
        type: MemberIdentityType.USERNAME,
        verified: true,
        sourceId,
      },
    )
  } else {
    identities.push({
      platform: PlatformType.LFID,
      value: email,
      type: MemberIdentityType.USERNAME,
      verified: true,
      sourceId,
    })
  }

  const type = row.USER_ATTENDED === true ? 'attended-event' : 'registered-event'

  const timestamp = (row.REGISTRATION_CREATED_TS as string | null) || null

  const price = row.REGISTRATION_REVENUE != null ? String(row.REGISTRATION_REVENUE as number) : null

  const activity: IActivityData = {
    type,
    platform: PlatformType.LFID,
    timestamp,
    score: 1,
    sourceId: registrationId,
    sourceParentId: row.EVENT_ID as string,
    member: {
      displayName,
      identities,
      organizations: row.ACCOUNT_NAME
        ? [
            {
              displayName: row.ACCOUNT_NAME as string,
              source: 'lfid' as never,
              identities: [],
            },
          ]
        : undefined,
    },
    attributes: {
      eventName: row.EVENT_NAME as string,
      eventDate: (row.EVENT_START_DATE as string | null) || null,
      location: (row.EVENT_LOCATION as string | null) || null,
      website:
        (row.EVENT_URL as string | null) === 'NULL' ? null : (row.EVENT_URL as string) || null,
      registrationType: (row.REGISTRATION_TYPE as string | null) || null,
      attendeeType: (row.EVENT_ATTENDANCE_TYPE as string | null) || null,
      voucherCode: null,
      price,
    },
  }

  return activity
}

const job: IJobDefinition = {
  name: 'snowflake-s3-export',
  cronTime: CronTime.every(24).hours(),
  timeout: 60 * 60 * 6,
  process: async (ctx) => {
    ctx.log.info('Starting Snowflake S3 export + consume pipeline...')

    // --- Initialize dependencies ---
    const redis = await getRedisClient(REDIS_CONFIG(), true)
    const cache = new RedisCache('snowflake-s3-export', redis, ctx.log)
    const snowflake = SnowflakeClient.fromToken({ parentLog: ctx.log })

    const kafkaClient = getKafkaClient(QUEUE_CONFIG())
    const queueService = new KafkaQueueService(kafkaClient, ctx.log)
    const dswEmitter = new DataSinkWorkerEmitter(queueService, ctx.log)
    await dswEmitter.init()
    ctx.log.info('Dependencies initialized (Redis, Snowflake, Kafka)')

    // --- Step 1: Export from Snowflake to S3 ---
    const s3ExportLastRunTimestamp = await cache.get('s3ExportLastRunTimestamp')
    ctx.log.info({ s3ExportLastRunTimestamp }, 'Last run timestamp from Redis')

    const sourceQuery = buildSourceQuery(s3ExportLastRunTimestamp || undefined)
    const runTimestamp = new Date().toISOString()
    const runDate = new Date(runTimestamp)
    const year = runDate.getUTCFullYear()
    const month = String(runDate.getUTCMonth() + 1).padStart(2, '0')
    const day = String(runDate.getUTCDate()).padStart(2, '0')
    const runPrefix = `${S3_BUCKET_PATH}/${TABLE_NAME}/${year}/${month}/${day}`

    const exportedFiles: string[] = []
    let batch = 0
    let totalRows = 0
    let totalBytes = 0
    let hasMoreRows = true

    while (hasMoreRows) {
      const offset = batch * BATCH_SIZE
      const batchLabel = String(batch + 1).padStart(4, '0')
      const filename = `batch_${batchLabel}.parquet`
      const s3Path = `${runPrefix}/${filename}`

      const copyQuery = `
        COPY INTO '${s3Path}'
        FROM (
          ${sourceQuery}
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        )
        STORAGE_INTEGRATION = ${STORAGE_INTEGRATION}
        FILE_FORMAT = (TYPE = PARQUET)
        HEADER = TRUE
        SINGLE = TRUE
        OVERWRITE = TRUE
      `

      ctx.log.info({ batch: batch + 1, offset, s3Path }, 'Running COPY INTO')
      const [result] = await snowflake.run<{ rows_unloaded: number; output_bytes: number }>(
        copyQuery,
      )

      if (result.rows_unloaded === 0) {
        ctx.log.info({ batch: batch + 1 }, 'No more rows to export')
        hasMoreRows = false
        break
      }

      totalRows += result.rows_unloaded
      totalBytes += result.output_bytes || 0
      exportedFiles.push(`${TABLE_NAME}/${year}/${month}/${day}/${filename}`)

      ctx.log.info({ batch: batch + 1, rows: result.rows_unloaded, totalRows }, 'Batch exported')

      hasMoreRows = result.rows_unloaded === BATCH_SIZE
      batch++
    }

    if (exportedFiles.length === 0) {
      ctx.log.info('No data exported, skipping manifest and consumer')
      return
    }

    // Write manifest
    const manifest = {
      runTimestamp,
      totalBatches: exportedFiles.length,
      totalRows,
      totalBytes,
      exportedFiles,
    }
    const manifestJson = JSON.stringify(manifest).replace(/'/g, "''")
    await snowflake.run(`
      COPY INTO '${runPrefix}/manifest.json'
      FROM (SELECT '${manifestJson}')
      STORAGE_INTEGRATION = ${STORAGE_INTEGRATION}
      FILE_FORMAT = (TYPE = CSV, COMPRESSION = NONE, FIELD_OPTIONALLY_ENCLOSED_BY = NONE, ESCAPE_UNENCLOSED_FIELD = NONE)
      SINGLE = TRUE
      OVERWRITE = TRUE
    `)
    ctx.log.info(manifest, 'Manifest written to S3')

    // Save state to Redis
    await cache.set('S3Filenames', JSON.stringify(exportedFiles))
    await cache.set('s3ExportLastRunTimestamp', runTimestamp)

    // --- Step 2: Consume from S3 and emit to Kafka ---
    ctx.log.info('Starting S3 consumer...')

    const s3 = new S3Client({
      region: process.env.CROWD_SNOWFLAKE_S3_REGION,
      credentials: {
        accessKeyId: process.env.CROWD_SNOWFLAKE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CROWD_SNOWFLAKE_S3_SECRET_ACCESS_KEY!,
      },
    })

    let totalEmitted = 0
    let totalSkipped = 0

    for (const fileKey of exportedFiles) {
      const s3Key = `${S3_PREFIX}/${fileKey}`
      ctx.log.info({ bucket: S3_BUCKET, key: s3Key }, 'Reading Parquet file from S3')

      const response = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }))
      const bodyBytes = await response.Body?.transformToByteArray()
      if (!bodyBytes) {
        ctx.log.warn({ fileKey }, 'Empty S3 object, skipping')
        continue
      }
      ctx.log.info({ fileKey, bytes: bodyBytes.length }, 'Downloaded Parquet file')

      const reader = await ParquetReader.openBuffer(Buffer.from(bodyBytes))
      const cursor = reader.getCursor()
      let row = await cursor.next()

      while (row) {
        const activity = transformRowToActivity(row as Record<string, unknown>)

        if (activity) {
          await dswEmitter.createAndProcessActivityResult(
            POC_SEGMENT_ID,
            POC_INTEGRATION_ID,
            activity,
          )
          totalEmitted++

          if (totalEmitted <= 3) {
            ctx.log.info({ activity }, 'Emitted activity to Kafka')
          }

          if (totalEmitted % 1000 === 0) {
            ctx.log.info({ totalEmitted }, 'Emit progress')
          }
        } else {
          totalSkipped++
        }

        row = await cursor.next()
      }

      await reader.close()
    }

    ctx.log.info(
      { totalRows, totalEmitted, totalSkipped, totalFiles: exportedFiles.length },
      'Snowflake S3 export + consume pipeline completed!',
    )
  },
}

export default job
