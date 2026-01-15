/**
 * Member Aggregates Cleanup Script
 *
 * PROBLEM:
 * Some records in the memberSegmentsAgg table reference members that no longer exist,
 * creating orphaned aggregation data that needs to be cleaned up.
 *
 * SOLUTION:
 * This script deletes orphaned member aggregates from the memberSegmentsAgg table
 * by finding records that reference non-existent members and removing them in batches.
 *
 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run cleanup-member-aggregates -- [--batch-size <size>] [--dry-run]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/cleanup-member-aggregates.ts [--batch-size <size>] [--dry-run]
 *
 * Options:
 *   --batch-size       Number of records to process in each batch (default: 10000)
 *   --dry-run          Display what would be deleted without actually deleting anything
 *
 * Environment Variables Required:
 *   CROWD_DB_WRITE_HOST - Postgres write host
 *   CROWD_DB_PORT - Postgres port
 *   CROWD_DB_USERNAME - Postgres username
 *   CROWD_DB_PASSWORD - Postgres password
 *   CROWD_DB_DATABASE - Postgres database name
 */
import * as fs from 'fs'
import * as path from 'path'

import {
  WRITE_DB_CONFIG,
  getDbConnection,
} from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('cleanup-member-aggregates-script')

// Type definitions
interface BatchResult {
  deletedCount: number
  success: boolean
  error?: string
}

interface CleanupSummary {
  totalBatches: number
  totalDeleted: number
  failedBatches: number
  startTime: string
  endTime: string
  batchSize: number
  dryRun: boolean
}

/**
 * Initialize Postgres connection using QueryExecutor
 */
async function initPostgresClient(): Promise<QueryExecutor> {
  log.info('Initializing Postgres connection...')

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const queryExecutor = pgpQx(dbConnection)

  log.info('Postgres connection established')
  return queryExecutor
}

/**
 * Count total orphaned member aggregates
 */
async function countOrphanedAggregates(postgres: QueryExecutor): Promise<number> {
  log.info('Counting orphaned member aggregates...')

  const query = `
    SELECT COUNT(*)::int as count
    FROM public."memberSegmentsAgg" msa
    LEFT JOIN public."members" m
      ON m.id = msa."memberId"
    WHERE m.id IS NULL
  `

  const result = await postgres.selectOne(query)
  const count = (result as { count: number }).count

  log.info(`Found ${count} orphaned member aggregate(s)`)
  return count
}

/**
 * Delete one batch of orphaned member aggregates
 */
async function deleteOrphanedAggregatesBatch(
  postgres: QueryExecutor,
  batchSize: number,
  dryRun: boolean,
): Promise<BatchResult> {
  try {
    if (dryRun) {
      log.info(`[DRY RUN] Would delete up to ${batchSize} orphaned member aggregates`)
      
      const query = `
        SELECT COUNT(*)::int as count
        FROM (
          SELECT msa."memberId", msa."segmentId"
          FROM public."memberSegmentsAgg" msa
          LEFT JOIN public."members" m
            ON m.id = msa."memberId"
          WHERE m.id IS NULL
          LIMIT $(batchSize)
        ) subquery
      `
      
      const result = await postgres.selectOne(query, { batchSize })
      const count = (result as { count: number }).count
      
      log.info(`[DRY RUN] Would delete ${count} record(s) in this batch`)
      return {
        deletedCount: count,
        success: true,
      }
    }

    const query = `
      WITH to_delete AS (
        SELECT msa."memberId", msa."segmentId"
        FROM public."memberSegmentsAgg" msa
        LEFT JOIN public."members" m
          ON m.id = msa."memberId"
        WHERE m.id IS NULL
        LIMIT $(batchSize)
      )
      DELETE FROM public."memberSegmentsAgg" msa
      USING to_delete d
      WHERE msa."memberId" = d."memberId"
        AND msa."segmentId" = d."segmentId"
    `

    const deletedCount = await postgres.result(query, { batchSize })
    
    if (deletedCount > 0) {
      log.info(`✓ Deleted ${deletedCount} orphaned member aggregate(s) in this batch`)
    }

    return {
      deletedCount,
      success: true,
    }
  } catch (error) {
    log.error(`Failed to delete batch: ${error.message}`)
    return {
      deletedCount: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Process cleanup in batches
 */
async function processCleanup(
  postgres: QueryExecutor,
  batchSize: number,
  dryRun: boolean,
): Promise<CleanupSummary> {
  const startTime = new Date().toISOString()
  let totalBatches = 0
  let totalDeleted = 0
  let failedBatches = 0

  log.info(`Starting cleanup process with batch size: ${batchSize}`)
  
  if (dryRun) {
    log.info('🧪 DRY RUN MODE - No data will be deleted')
  }

  // Count total orphaned aggregates first
  const totalOrphaned = await countOrphanedAggregates(postgres)
  
  if (totalOrphaned === 0) {
    log.info('No orphaned member aggregates found. Cleanup complete.')
    
    return {
      totalBatches: 0,
      totalDeleted: 0,
      failedBatches: 0,
      startTime,
      endTime: new Date().toISOString(),
      batchSize,
      dryRun,
    }
  }

  log.info(`Processing ${totalOrphaned} total orphaned record(s) in batches of ${batchSize}`)

  let hasMore = true
  
  while (hasMore) {
    totalBatches++
    
    log.info(`Processing batch ${totalBatches}...`)
    
    const batchResult = await deleteOrphanedAggregatesBatch(postgres, batchSize, dryRun)
    
    if (batchResult.success) {
      totalDeleted += batchResult.deletedCount
      
      // If we deleted fewer records than the batch size, we're done
      if (batchResult.deletedCount < batchSize) {
        hasMore = false
        log.info(`Batch ${totalBatches} processed ${batchResult.deletedCount} record(s). No more records to process.`)
      } else {
        log.info(`Batch ${totalBatches} completed. ${batchResult.deletedCount} record(s) processed.`)
      }
    } else {
      failedBatches++
      log.error(`Batch ${totalBatches} failed: ${batchResult.error}`)
      
      // Continue with next batch instead of stopping
    }
    
    // Safety check to prevent infinite loops
    if (totalBatches >= 1000) {
      log.warn('Reached maximum batch limit (1000). Stopping to prevent infinite loops.')
      hasMore = false
    }
  }

  const endTime = new Date().toISOString()

  return {
    totalBatches,
    totalDeleted,
    failedBatches,
    startTime,
    endTime,
    batchSize,
    dryRun,
  }
}

/**
 * Write cleanup summary to file
 */
function writeCleanupSummary(summary: CleanupSummary): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `cleanup_member_aggregates_${timestamp}.json`
  const filepath = path.join('/tmp', filename)

  try {
    fs.writeFileSync(filepath, JSON.stringify(summary, null, 2), 'utf-8')
    log.info(`✓ Cleanup summary saved to: ${filepath}`)
  } catch (error) {
    log.error(`Failed to write cleanup summary to ${filepath}: ${error.message}`)
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse command line arguments
  const batchSizeIndex = args.indexOf('--batch-size')
  const dryRunIndex = args.indexOf('--dry-run')
  
  const dryRun = dryRunIndex !== -1
  
  let batchSize = 10000 // Default batch size
  if (batchSizeIndex !== -1) {
    if (batchSizeIndex + 1 >= args.length) {
      log.error('Error: --batch-size requires a value')
      process.exit(1)
    }
    const batchSizeValue = parseInt(args[batchSizeIndex + 1], 10)
    if (isNaN(batchSizeValue) || batchSizeValue <= 0) {
      log.error('Error: --batch-size must be a positive integer')
      process.exit(1)
    }
    batchSize = batchSizeValue
  }

  // Check for help flag or invalid arguments
  if (args.includes('--help') || args.includes('-h')) {
    log.info(`
      Usage:
        # Via package.json script (recommended):
        pnpm run cleanup-member-aggregates -- [--batch-size <size>] [--dry-run]
        
        # Or directly with tsx:
        npx tsx src/bin/cleanup-member-aggregates.ts [--batch-size <size>] [--dry-run]
      
      Options:
        --batch-size <size>: Number of records to process in each batch (default: 10000)
        --dry-run: Display what would be deleted without actually deleting anything
      
      Examples:
        # Run cleanup with default batch size (10000)
        pnpm run cleanup-member-aggregates
        
        # Run with custom batch size
        pnpm run cleanup-member-aggregates -- --batch-size 5000
        
        # Dry run to preview what would be deleted
        pnpm run cleanup-member-aggregates -- --dry-run
        
        # Dry run with custom batch size
        pnpm run cleanup-member-aggregates -- --batch-size 1000 --dry-run
    `)
    process.exit(0)
  }

  try {
    log.info(`\n${'='.repeat(80)}`)
    log.info('Member Aggregates Cleanup Script')
    log.info(`${'='.repeat(80)}`)
    log.info(`Batch size: ${batchSize}`)
    if (dryRun) {
      log.info('Mode: DRY RUN (no data will be deleted)')
    } else {
      log.info('Mode: LIVE (data will be deleted)')
    }
    log.info(`${'='.repeat(80)}\n`)

    // Initialize database connection
    const postgres = await initPostgresClient()

    // Process cleanup
    const summary = await processCleanup(postgres, batchSize, dryRun)

    // Write summary to file
    writeCleanupSummary(summary)

    // Print final summary
    log.info(`\n${'='.repeat(80)}`)
    log.info('Cleanup Summary')
    log.info(`${'='.repeat(80)}`)
    log.info(`✓ Total batches processed: ${summary.totalBatches}`)
    log.info(`✓ Total records ${dryRun ? 'found' : 'deleted'}: ${summary.totalDeleted}`)
    if (summary.failedBatches > 0) {
      log.warn(`✗ Failed batches: ${summary.failedBatches}`)
    }
    log.info(`Duration: ${summary.startTime} → ${summary.endTime}`)

    const exitCode = summary.failedBatches > 0 ? 1 : 0
    process.exit(exitCode)

  } catch (error) {
    log.error(error, 'Failed to run cleanup script')
    log.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  log.error('Unexpected error:', error)
  process.exit(1)
})