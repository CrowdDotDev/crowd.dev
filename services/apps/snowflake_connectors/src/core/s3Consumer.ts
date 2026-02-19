/**
 * S3 data consumption logic.
 *
 * Responsible for reading exported files from S3
 * (e.g., Parquet manifests or raw data) for downstream transformation.
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { ParquetReader } from '@dsnp/parquetjs'

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

  async downloadFile(s3Uri: string): Promise<Buffer> {
    const { bucket, key } = this.parseS3Uri(s3Uri)
    const response = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const byteArray = await response.Body!.transformToByteArray()
    return Buffer.from(byteArray)
  }

  async readParquetRows(s3Uri: string): Promise<Record<string, unknown>[]> {
    const buffer = await this.downloadFile(s3Uri)
    const reader = await ParquetReader.openBuffer(buffer)
    const cursor = reader.getCursor()
    const rows: Record<string, unknown>[] = []
    let row: Record<string, unknown> | null
    while ((row = await cursor.next()) !== null) {
      rows.push(row)
    }
    await reader.close()
    return rows
  }

  private parseS3Uri(s3Uri: string): { bucket: string; key: string } {
    const url = new URL(s3Uri)
    return { bucket: url.hostname, key: url.pathname.slice(1) }
  }
}
