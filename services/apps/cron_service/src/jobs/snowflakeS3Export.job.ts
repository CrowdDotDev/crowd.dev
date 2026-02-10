import CronTime from 'cron-time-generator'

import { REDIS_CONFIG, RedisCache, getRedisClient } from '@crowd/redis'
import { SnowflakeClient } from '@crowd/snowflake'

import { IJobDefinition } from '../types'

const S3_BUCKET_PATH = 's3://cdp-snowflake-connectors-stg/raw-data'
const STORAGE_INTEGRATION = 'CDP_S3_EXPORT_INTEGRATION'
const TABLE_NAME = 'event_registrations'
const BATCH_SIZE = parseInt(process.env.CROWD_SNOWFLAKE_EXPORT_BATCH_SIZE || '10000', 10)

// TIMESTAMP_TZ columns that must be cast to TIMESTAMP_NTZ for Parquet export
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

const TS_EXCLUDE = TIMESTAMP_TZ_COLUMNS.join(', ')
const TS_CASTS = TIMESTAMP_TZ_COLUMNS.map((c) => `r.${c}::TIMESTAMP_NTZ AS ${c}`).join(', ')

const buildSourceQuery = (s3ExportLastRunTimestamp?: string) => {
  const baseQuery = `
  	SELECT
		r.* EXCLUDE (${TS_EXCLUDE}),
		${TS_CASTS},
		i.INTEGRATION_ID
	FROM ANALYTICS.SILVER_FACT.event_registrations r
	LEFT JOIN ANALYTICS.SILVER_DIM._CROWD_DEV_SEGMENTS_UNION s
		ON s.slug = r.project_slug
		AND s.PARENT_SLUG is null
		AND s.GRANDPARENTS_SLUG is null
	LEFT JOIN ANALYTICS.SILVER_DIM._CROWD_DEV_INTEGRATIONS_UNION i
		ON i.SEGMENT_ID = s.SEGMENT_ID
	WHERE r.project_slug='pytorch'` // TODO: pytorch only for POC purposes, will be removed later
  if (s3ExportLastRunTimestamp) {
    return `${baseQuery} AND updated_ts > '${s3ExportLastRunTimestamp}'`
  }
  return baseQuery
}

const job: IJobDefinition = {
  name: 'snowflake-s3-export',
  cronTime: CronTime.every(24).hours(),
  timeout: 60 * 60, // 1 hour
  process: async (ctx) => {
    ctx.log.info('Starting Snowflake S3 export job!')

    const redis = await getRedisClient(REDIS_CONFIG(), true)
    const cache = new RedisCache('snowflake-s3-export', redis, ctx.log)
    const snowflake = SnowflakeClient.fromToken({ parentLog: ctx.log })

    // Check for last run timestamp — if none, this is a full export
    const s3ExportLastRunTimestamp = await cache.get('s3ExportLastRunTimestamp')
    if (s3ExportLastRunTimestamp) {
      ctx.log.info({ s3ExportLastRunTimestamp }, 'Incremental export since last run')
    } else {
      ctx.log.info('No previous run found, performing full export')
    }

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

      ctx.log.info({ batch: batch + 1, offset, filename }, 'Exporting batch')
      const [result] = await snowflake.run<{ rows_unloaded: number; output_bytes: number }>(
        copyQuery,
      )

      if (!result || result.rows_unloaded === 0) {
        ctx.log.info({ batch: batch + 1 }, 'No more rows to export')
        hasMoreRows = false
        break
      }

      ctx.log.info({ batch: batch + 1, result }, 'Batch export completed')
      totalRows += result.rows_unloaded
      totalBytes += result.output_bytes || 0
      exportedFiles.push(`${TABLE_NAME}/${year}/${month}/${day}/${filename}`)
      batch++
    }

    // Write manifest.json to S3 with export summary
    const manifest = {
      runTimestamp,
      totalBatches: batch,
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

    // Redis will be used only for POC purposes, will be removed later
    await cache.set('S3Filenames', JSON.stringify(exportedFiles))
    await cache.set('s3ExportLastRunTimestamp', runTimestamp)

    ctx.log.info(manifest, 'Snowflake S3 export job completed!')
  },
}

export default job
