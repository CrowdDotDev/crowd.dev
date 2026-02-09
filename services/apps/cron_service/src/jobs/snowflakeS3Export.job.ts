import CronTime from 'cron-time-generator'

import { REDIS_CONFIG, RedisCache, getRedisClient } from '@crowd/redis'
import { SnowflakeClient } from '@crowd/snowflake'

import { IJobDefinition } from '../types'

const S3_BUCKET_PATH = 's3://cdp-snowflake-connectors-stg/raw-data'
const STORAGE_INTEGRATION = 'CDP_S3_EXPORT_INTEGRATION'
const BATCH_SIZE = parseInt(process.env.CROWD_SNOWFLAKE_EXPORT_BATCH_SIZE || '10000', 10)

const buildSourceQuery = (s3ExportLastRunTimestamp?: string) => {
  const baseQuery = `
  	SELECT
		r.*,
		i.id AS integrationId
	FROM ANALYTICS.SILVER_FACT.event_registrations r
	LEFT JOIN ANALYTICS.SILVER_DIM._CROWD_DEV_SEGMENTS_UNION s
		ON s.slug = r.project_slug
		AND s.PARENT_SLUG is null
		AND s.GRANDPARENTS_SLUG is null
	LEFT JOIN ANALYTICS.SILVER_DIM._CROWD_DEV_INTEGRATIONS_UNION i
		ON i.SEGMENT_ID = s.SEGMENT_ID`
  if (s3ExportLastRunTimestamp) {
    return `${baseQuery} WHERE updated_ts > '${s3ExportLastRunTimestamp}'`
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
    const fileTimestamp = runTimestamp.replace(/[:.]/g, '-')
    const exportedFiles: string[] = []
    let batch = 0

    while (true) {
      const offset = batch * BATCH_SIZE
      const batchLabel = String(batch + 1).padStart(4, '0')
      const filename = `export_${fileTimestamp}_batch_${batchLabel}.parquet`
      const s3Path = `${S3_BUCKET_PATH}/${filename}`

      const copyQuery = `
        COPY INTO '${s3Path}'
        FROM (
          SELECT * FROM (${sourceQuery})
          LIMIT ${BATCH_SIZE} OFFSET ${offset}
        )
        STORAGE_INTEGRATION = ${STORAGE_INTEGRATION}
        FILE_FORMAT = (TYPE = PARQUET)
        SINGLE = TRUE
        OVERWRITE = TRUE
      `

      ctx.log.info({ batch: batch + 1, offset, filename }, 'Exporting batch')
      const [result] = await snowflake.run<{ rows_unloaded: number }>(copyQuery)

      if (!result || result.rows_unloaded === 0) {
        ctx.log.info({ batch: batch + 1 }, 'No more rows to export')
        break
      }

      ctx.log.info({ batch: batch + 1, result }, 'Batch export completed')
      exportedFiles.push(filename)
      batch++
    }

    // Redis will be used only for POC purposes, will be removed later
    await cache.set('S3Filenames', JSON.stringify(exportedFiles))
    await cache.set('s3ExportLastRunTimestamp', runTimestamp)

    ctx.log.info(
      { exportedFiles, runTimestamp, totalBatches: batch },
      'Snowflake S3 export job completed!',
    )
  },
}

export default job
