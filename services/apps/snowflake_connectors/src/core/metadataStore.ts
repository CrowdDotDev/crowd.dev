/**
 * Database operations for integration.snowflakeExportJobs.
 *
 * Tracks export batches, processing status, and timestamps
 * to enable incremental exports and consumer polling.
 */

import type { DbConnection } from '@crowd/database'

export interface SnowflakeExportJob {
  id: number
  platform: string
  s3Path: string
  totalRows: number
  totalBytes: number
  createdAt: Date
  updatedAt: Date
  processingStartedAt: Date | null
  completedAt: Date | null
  cleanedAt: Date | null
  error: string | null
}

export class MetadataStore {
  constructor(private readonly db: DbConnection) {}

  async insertExportJob(
    platform: string,
    s3Path: string,
    totalRows: number,
    totalBytes: number,
  ): Promise<void> {
    await this.db.none(
      `INSERT INTO integration."snowflakeExportJobs" (platform, s3_path, "totalRows", "totalBytes")
       VALUES ($1, $2, $3, $4)`,
      [platform, s3Path, totalRows, totalBytes],
    )
  }

  /**
   * Get pending jobs ready for transformation (processingStartedAt is null).
   */
  async getPendingJobs(): Promise<SnowflakeExportJob[]> {
    const rows = await this.db.manyOrNone<{
      id: number
      platform: string
      s3_path: string
      totalRows: string
      totalBytes: string
      createdAt: Date
      updatedAt: Date
      processingStartedAt: Date | null
      completedAt: Date | null
      cleanedAt: Date | null
      error: string | null
    }>(
      `SELECT id, platform, s3_path, "totalRows", "totalBytes",
              "createdAt", "updatedAt", "processingStartedAt", "completedAt", "cleanedAt", error
       FROM integration."snowflakeExportJobs"
       WHERE "processingStartedAt" IS NULL
       ORDER BY "createdAt" ASC`,
    )
    return (rows ?? []).map(mapRowToJob)
  }
}

function mapRowToJob(row: {
  id: number
  platform: string
  s3_path: string
  totalRows: string
  totalBytes: string
  createdAt: Date
  updatedAt: Date
  processingStartedAt: Date | null
  completedAt: Date | null
  cleanedAt: Date | null
  error: string | null
}): SnowflakeExportJob {
  return {
    id: row.id,
    platform: row.platform,
    s3Path: row.s3_path,
    totalRows: Number(row.totalRows),
    totalBytes: Number(row.totalBytes),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    processingStartedAt: row.processingStartedAt,
    completedAt: row.completedAt,
    cleanedAt: row.cleanedAt,
    error: row.error,
  }
}
