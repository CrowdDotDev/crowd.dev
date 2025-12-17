/**
 * Gerrit Activities Cleanup Script
 *
 * PROBLEM:
 * Gerrit activities need to be cleaned up from both PostgreSQL and Tinybird
 * based on specific platform and type filters with a date cutoff.
 *
 * SOLUTION:
 * This script deletes activities from Gerrit platform across:
 * - PostgreSQL (activityRelations table only)
 * - Tinybird (activities and activityRelations tables)
 *
 * Filters:
 * - platform = 'gerrit'
 * - type in ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created')
 * - updatedAt < '2025-12-15'
 *
 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run cleanup-gerrit-activities -- [--dry-run] [--tb-token <token>]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/cleanup-gerrit-activities.ts [--dry-run] [--tb-token <token>]
 *
 * Options:
 *   --dry-run          Display what would be deleted without actually deleting anything
 *   --tb-token         Tinybird API token to use (overrides CROWD_TINYBIRD_ACTIVITIES_TOKEN environment variable)
 *
 * Environment Variables Required:
 *   CROWD_DB_WRITE_HOST - Postgres write host
 *   CROWD_DB_PORT - Postgres port
 *   CROWD_DB_USERNAME - Postgres username
 *   CROWD_DB_PASSWORD - Postgres password
 *   CROWD_DB_DATABASE - Postgres database name
 *   CROWD_TINYBIRD_BASE_URL - Tinybird API base URL
 *   CROWD_TINYBIRD_ACTIVITIES_TOKEN - Tinybird API token
 */
import * as fs from 'fs'
import * as path from 'path'

import {
  TinybirdClient,
  WRITE_DB_CONFIG,
  getDbConnection,
} from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('cleanup-gerrit-activities-script')

interface DeletionStatus {
  success: boolean
  jobId?: string
  error?: string
}

interface CleanupResult {
  status: 'success' | 'failure'
  startTime: string
  endTime: string
  deletions: {
    postgres: {
      activityRelations: DeletionStatus & { deletedCount?: number }
    }
    tinybird: {
      activities: DeletionStatus
      activityRelations: DeletionStatus
    }
  }
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
 * Delete activity relations from Postgres based on Gerrit filters
 */
async function deleteActivityRelationsFromPostgres(
  postgres: QueryExecutor,
  dryRun = false,
): Promise<DeletionStatus & { deletedCount?: number }> {
  const whereClause = `
    WHERE platform = 'gerrit' 
    AND type IN ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created')
    AND "updatedAt" < '2025-12-15'
  `

  if (dryRun) {
    log.info('[DRY RUN] Querying activity relations from Postgres for Gerrit cleanup...')
    const countQuery = `
      SELECT COUNT(*) as count
      FROM "activityRelations"
      ${whereClause}
    `
    try {
      const result = (await postgres.selectOne(countQuery)) as { count: string }
      const rowCount = parseInt(result.count, 10)
      log.info(`[DRY RUN] Would delete ${rowCount} activity relation(s) from Postgres`)
      return { success: true, deletedCount: rowCount }
    } catch (error) {
      log.error(`Failed to query activity relations from Postgres: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  log.info('Deleting activity relations from Postgres for Gerrit cleanup...')
  const deleteQuery = `
    DELETE FROM "activityRelations"
    ${whereClause}
  `

  try {
    const rowCount = await postgres.result(deleteQuery)
    log.info(`✓ Deleted ${rowCount} activity relation(s) from Postgres`)
    return { success: true, deletedCount: rowCount }
  } catch (error) {
    log.error(`Failed to delete activity relations from Postgres: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Delete activities from Tinybird using the delete API
 */
async function deleteActivitiesFromTinybird(
  tinybird: TinybirdClient,
  dryRun = false,
): Promise<{
  activities: DeletionStatus
  activityRelations: DeletionStatus
  jobIds: string[]
}> {
  const results = {
    activities: { success: false } as DeletionStatus,
    activityRelations: { success: false } as DeletionStatus,
  }

  if (dryRun) {
    log.info('[DRY RUN] Would delete activities from Tinybird using Gerrit filters...')
    log.info(
      `[DRY RUN] Filters: platform='gerrit', type in ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created'), updatedAt < '2025-12-15'`,
    )
    log.info(`[DRY RUN] Would delete from 'activities' datasource`)
    log.info(`[DRY RUN] Would delete from 'activityRelations' datasource`)
    return {
      activities: { success: true },
      activityRelations: { success: true },
      jobIds: [],
    }
  }

  log.info('Deleting activities from Tinybird using Gerrit filters...')

  const triggeredJobIds: string[] = []

  // Define deletion conditions
  const activitiesDeleteCondition = `platform = 'gerrit' AND type IN ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created') AND updatedAt < '2025-12-15'`
  const activityRelationsDeleteCondition = `platform = 'gerrit' AND type IN ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created') AND updatedAt < '2025-12-15'`

  // Delete from activities datasource
  try {
    log.info('Triggering deletion job for activities datasource...')
    const activitiesJobResponse = await tinybird.deleteDatasource(
      'activities',
      activitiesDeleteCondition,
      true,
      false, // Don't wait
    )
    log.info(`✓ Triggered deletion job for activities (job_id: ${activitiesJobResponse.job_id})`)
    triggeredJobIds.push(activitiesJobResponse.job_id)
    results.activities = {
      success: true,
      jobId: activitiesJobResponse.job_id,
    }
  } catch (error) {
    log.error(`Failed to trigger deletion job for activities datasource: ${error.message}`)
    results.activities = {
      success: false,
      error: error.message,
    }
  }

  // Delete from activityRelations datasource
  try {
    log.info('Triggering deletion job for activityRelations datasource...')
    const activityRelationsJobResponse = await tinybird.deleteDatasource(
      'activityRelations',
      activityRelationsDeleteCondition,
      true,
      false, // Don't wait
    )
    log.info(
      `✓ Triggered deletion job for activityRelations (job_id: ${activityRelationsJobResponse.job_id})`,
    )
    triggeredJobIds.push(activityRelationsJobResponse.job_id)
    results.activityRelations = {
      success: true,
      jobId: activityRelationsJobResponse.job_id,
    }
  } catch (error) {
    log.error(`Failed to trigger deletion job for activityRelations datasource: ${error.message}`)
    results.activityRelations = {
      success: false,
      error: error.message,
    }
  }

  log.info(`✓ All deletion jobs triggered (${triggeredJobIds.length} running in background)`)

  return {
    ...results,
    jobIds: triggeredJobIds,
  }
}

/**
 * Main cleanup process
 */
async function runCleanup(dryRun = false, tbToken?: string): Promise<void> {
  const startTime = new Date().toISOString()

  if (dryRun) {
    log.info(`\n${'='.repeat(80)}`)
    log.info(`[DRY RUN MODE] Gerrit Activities Cleanup`)
    log.info(`${'='.repeat(80)}`)
  } else {
    log.info(`\n${'='.repeat(80)}`)
    log.info(`Gerrit Activities Cleanup`)
    log.info(`${'='.repeat(80)}`)
  }

  try {
    // Initialize database clients
    const postgres = await initPostgresClient()
    const tinybird = new TinybirdClient(tbToken)

    // Step 1: Delete activity relations from Postgres
    log.info('Step 1: Deleting activity relations from Postgres...')
    const postgresStatus = await deleteActivityRelationsFromPostgres(postgres, dryRun)

    // Step 2: Delete from Tinybird
    log.info('Step 2: Deleting activities from Tinybird...')
    const tinybirdStatuses = await deleteActivitiesFromTinybird(tinybird, dryRun)

    // Wait for all Tinybird deletion jobs to complete
    if (!dryRun && tinybirdStatuses.jobIds.length > 0) {
      log.info(
        `Waiting for ${tinybirdStatuses.jobIds.length} Tinybird deletion job(s) to complete...`,
      )
      try {
        await tinybird.waitForJobs(tinybirdStatuses.jobIds, 60000, 3600000) // 1min interval, 1h timeout
        log.info(`✓ All Tinybird deletion jobs completed`)
      } catch (error) {
        log.error(`Failed to wait for Tinybird deletion jobs: ${error.message}`)
        // Continue anyway - jobs are still running in background
      }
    }

    // Create cleanup result
    const endTime = new Date().toISOString()
    const result: CleanupResult = {
      status:
        postgresStatus.success &&
        tinybirdStatuses.activities.success &&
        tinybirdStatuses.activityRelations.success
          ? 'success'
          : 'failure',
      startTime,
      endTime,
      deletions: {
        postgres: {
          activityRelations: postgresStatus,
        },
        tinybird: {
          activities: tinybirdStatuses.activities,
          activityRelations: tinybirdStatuses.activityRelations,
        },
      },
    }

    // Save results to file
    const jsonFilePath = path.join(
      '/tmp',
      `cleanup_gerrit_activities_${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    )
    try {
      fs.writeFileSync(jsonFilePath, JSON.stringify(result, null, 2), 'utf-8')
      log.info(`✓ Cleanup results saved to: ${jsonFilePath}`)
    } catch (error) {
      log.error(`Failed to write cleanup results to ${jsonFilePath}: ${error.message}`)
    }

    // Summary
    log.info(`\n${'='.repeat(80)}`)
    log.info('Cleanup Summary')
    log.info(`${'='.repeat(80)}`)
    if (postgresStatus.success) {
      log.info(
        `✓ Postgres activity relations ${dryRun ? 'found' : 'deleted'}: ${postgresStatus.deletedCount || 0}`,
      )
    } else {
      log.error(`✗ Postgres deletion failed: ${postgresStatus.error}`)
    }

    if (tinybirdStatuses.activities.success) {
      log.info(
        `✓ Tinybird activities deletion job ${dryRun ? 'would be' : 'was'} triggered: ${tinybirdStatuses.activities.jobId || 'N/A'}`,
      )
    } else {
      log.error(`✗ Tinybird activities deletion failed: ${tinybirdStatuses.activities.error}`)
    }

    if (tinybirdStatuses.activityRelations.success) {
      log.info(
        `✓ Tinybird activityRelations deletion job ${dryRun ? 'would be' : 'was'} triggered: ${tinybirdStatuses.activityRelations.jobId || 'N/A'}`,
      )
    } else {
      log.error(
        `✗ Tinybird activityRelations deletion failed: ${tinybirdStatuses.activityRelations.error}`,
      )
    }

    if (result.status === 'failure') {
      process.exit(1)
    }
  } catch (error) {
    log.error(`Failed to run Gerrit cleanup: ${error.message}`)
    throw error
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2)

  // Parse flags
  const dryRunIndex = args.indexOf('--dry-run')
  const tbTokenIndex = args.indexOf('--tb-token')
  const dryRun = dryRunIndex !== -1

  // Extract tb-token value if provided
  let tbToken: string | undefined
  if (tbTokenIndex !== -1) {
    if (tbTokenIndex + 1 >= args.length) {
      log.error('Error: --tb-token requires a value')
      process.exit(1)
    }
    tbToken = args[tbTokenIndex + 1]
  }

  // Check for help flag or no valid arguments
  if (args.includes('--help') || args.includes('-h')) {
    log.info(`
      Usage:
        # Via package.json script (recommended):
        pnpm run cleanup-gerrit-activities -- [--dry-run] [--tb-token <token>]
        
        # Or directly with tsx:
        npx tsx src/bin/cleanup-gerrit-activities.ts [--dry-run] [--tb-token <token>]
      
      Options:
        --dry-run: (optional) Display what would be deleted without actually deleting anything
        --tb-token: (optional) Tinybird API token to use (overrides CROWD_TINYBIRD_ACTIVITIES_TOKEN environment variable)
      
      Examples:
        # Run cleanup
        pnpm run cleanup-gerrit-activities
        
        # Dry run to preview what would be deleted
        pnpm run cleanup-gerrit-activities -- --dry-run
        
        # Use custom Tinybird token
        pnpm run cleanup-gerrit-activities -- --tb-token your-token-here
      
      Filters applied:
        - platform = 'gerrit'
        - type in ('changeset-merged', 'changeset-abandoned', 'patchset_approval-created')
        - updatedAt < '2025-12-15'
    `)
    process.exit(0)
  }

  if (dryRun) {
    log.info(`\n${'='.repeat(80)}`)
    log.info('🧪 DRY RUN MODE - No data will be deleted')
    log.info(`${'='.repeat(80)}\n`)
  }

  try {
    await runCleanup(dryRun, tbToken)
  } catch (error) {
    log.error(error, 'Failed to run Gerrit cleanup script')
    log.error(`\n❌ Error: ${error.message}`)
    process.exit(1)
  }
}

main().catch((error) => {
  log.error('Unexpected error:', error)
  process.exit(1)
})
