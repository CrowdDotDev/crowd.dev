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
   * Atomically claim the oldest pending job by setting processingStartedAt.
   * Uses FOR UPDATE SKIP LOCKED so concurrent consumers never pick the same row.
   */
  async claimOldestPendingJob(): Promise<SnowflakeExportJob | null> {
    const row = await this.db.oneOrNone<{
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
      `UPDATE integration."snowflakeExportJobs"
       SET "processingStartedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = (
         SELECT id FROM integration."snowflakeExportJobs"
         WHERE "processingStartedAt" IS NULL
         ORDER BY "createdAt" ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, platform, s3_path, "totalRows", "totalBytes",
                 "createdAt", "updatedAt", "processingStartedAt", "completedAt", "cleanedAt", error`,
    )
    return row ? mapRowToJob(row) : null
  }

  async markCompleted(jobId: number): Promise<void> {
    await this.db.none(
      `UPDATE integration."snowflakeExportJobs"
       SET "completedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [jobId],
    )
  }

  async markFailed(jobId: number, error: string): Promise<void> {
    await this.db.none(
      `UPDATE integration."snowflakeExportJobs"
       SET error = $2, "updatedAt" = NOW()
       WHERE id = $1`,
      [jobId, error],
    )
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
