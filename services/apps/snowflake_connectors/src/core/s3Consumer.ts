/**
 * S3 data consumption logic.
 *
 * Responsible for reading exported files from S3
 * (e.g., Parquet manifests or raw data) for downstream transformation.
 */

import { S3Client } from '@aws-sdk/client-s3'

export interface S3Object {
  key: string
  size: number
  lastModified: Date
}

export class S3Consumer {
  private readonly s3: S3Client

  constructor() {
    this.s3 = new S3Client({
      region: process.env.CROWD_SNOWFLAKE_S3_REGION,
      credentials: {
        accessKeyId: process.env.CROWD_SNOWFLAKE_S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CROWD_SNOWFLAKE_S3_SECRET_ACCESS_KEY!,
      },
    })
  }

  // TODO: listExportedFiles(prefix: string): Promise<S3Object[]>
  // TODO: readManifest(manifestKey: string): Promise<Record<string, unknown>>
  // TODO: downloadFile(key: string): Promise<Buffer>
}
