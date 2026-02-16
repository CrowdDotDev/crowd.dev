/**
 * Snowflake COPY INTO logic.
 *
 * Responsible for executing COPY INTO queries against Snowflake
 * to export data into S3 as Parquet files.
 */

import { SnowflakeClient } from '../config/settings'

export interface CopyIntoResult {
  rowsUnloaded: number
  outputBytes: number
  exportedFiles: string[]
}

export class SnowflakeExporter {
  constructor(private readonly snowflake: SnowflakeClient) {}


  async executeCopyInto(query: string): Promise<CopyIntoResult> {
    // TODO: Execute the COPY INTO query via this.snowflake.run()
    // TODO: Parse result and return CopyIntoResult
    throw new Error('Not implemented')
  }

  async executeBatchedCopyInto(
    sourceQuery: string,
    s3Prefix: string,
    batchSize: number,
  ): Promise<CopyIntoResult> {
    // TODO: Loop over batches, call executeCopyInto for each, aggregate results
    throw new Error('Not implemented')
  }
}
