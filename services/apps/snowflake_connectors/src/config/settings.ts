/**
 * Centralized configuration: Snowflake, Temporal, and S3.
 */

import { S3Client } from '@aws-sdk/client-s3'

export { SnowflakeClient } from '@crowd/snowflake'
export { TEMPORAL_CONFIG, getTemporalClient } from '@crowd/temporal'
export type { ITemporalConfig } from '@crowd/temporal'

export function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.CROWD_SNOWFLAKE_S3_REGION,
    credentials: {
      accessKeyId: process.env.CROWD_SNOWFLAKE_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CROWD_SNOWFLAKE_S3_SECRET_ACCESS_KEY!,
    },
  })
}
