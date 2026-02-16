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
  constructor(private readonly s3: S3Client) {}

}
