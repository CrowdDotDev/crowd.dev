/**
 * Export activity: Execute COPY INTO + write metadata.
 *
 * This activity is invoked by the exportWorkflow and performs
 * the actual Snowflake export and metadata bookkeeping.
 */

import { PlatformType } from '@crowd/types'

import { SnowflakeClient } from '../config/settings'
import { SnowflakeExporter } from '../core/snowflakeExporter'
import { MetadataStore } from '../core/metadataStore'
import { getPlatform } from '../integrations'
export { getEnabledPlatforms } from '../integrations'

export async function executeExport(platform: PlatformType): Promise<void> {
  // TODO: Initialize SnowflakeClient via SnowflakeClient.fromToken()
  // TODO: Look up platform and build the source query:
  //   const def = getPlatform(platform)
  //   const sourceQuery = def.buildSourceQuery(sinceTimestamp)
  // TODO: Create a metadata record for this run
  // TODO: Execute the COPY INTO via SnowflakeExporter
  // TODO: Update metadata record with results (success or failure)
  throw new Error('Not implemented')
}
