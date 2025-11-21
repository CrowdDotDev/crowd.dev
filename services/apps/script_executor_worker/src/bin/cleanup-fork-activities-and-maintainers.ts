/**
 * Fork Activities and Maintainers Cleanup Script
 *
 * PROBLEM:
 * When a fork repository is onboarded, all activities from the original project are wrongly
 * attributed to the new, forked project. This makes the data inaccurate.
 *
 * SOLUTION:
 * This script deletes all activities and maintainers from forked repositories across:
 * - Tinybird
 * - CDP Postgres
 *
 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run cleanup-fork-activities -- <repo-url> [<repo-url> ...] [--dry-run] [--tb-token <token>]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/cleanup-fork-activities-and-maintainers.ts <repo-url> [<repo-url> ...] [--dry-run] [--tb-token <token>]
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

const log = getServiceChildLogger('cleanup-fork-activities-script')

// Type definitions
interface ForkRepository {
  id: string
  url: string
  segmentId: string
  forkedFrom: string
}

interface DatabaseClients {
  postgres: QueryExecutor
}

interface DeletionStatus {
  success: boolean
  jobId?: string
  error?: string
}

interface BatchResult {
  batchNumber: string
  deletions: {
    postgres: DeletionStatus
    tinybird: {
      activities: DeletionStatus
      activities_deduplicated_ds: DeletionStatus
      activityRelations: DeletionStatus
      activityRelations_deduplicated_cleaned_ds: DeletionStatus
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
 * Initialize all database clients
 */
async function initDatabaseClients(): Promise<DatabaseClients> {
  log.info('Initializing database clients...')

  const postgres = await initPostgresClient()

  log.info('All database clients initialized successfully')

  return {
    postgres,
  }
}

/**
 * Lookup a single fork repository by URL
 */
async function lookupForkRepository(postgres: QueryExecutor, url: string): Promise<ForkRepository> {
  log.info(`Looking up repository by URL: ${url}`)

  const query = `
    SELECT 
      id,
      url,
      "segmentId",
      "forkedFrom"
    FROM git.repositories
    WHERE url = $(url)
      AND "forkedFrom" IS NOT NULL
  `

  const repo = (await postgres.selectOneOrNone(query, { url })) as ForkRepository | null

  if (!repo) {
    // Check if repository exists but is not a fork
    const checkQuery = `
      SELECT id, url, "forkedFrom"
      FROM git.repositories
      WHERE url = $(url)
    `
    const check = await postgres.selectOneOrNone(checkQuery, { url })

    if (!check) {
      throw new Error(`Repository not found in database: ${url}`)
    } else {
      throw new Error(`Repository is not a fork (forkedFrom is null): ${url}`)
    }
  }

  log.info(`✓ Found fork repository: ${repo.url} → ${repo.forkedFrom}`)
  return repo
}

/**
 * Lock a repository to prevent concurrent cleanup operations
 */
async function lockRepository(
  postgres: QueryExecutor,
  repoId: string,
  repoUrl: string,
  dryRun = false,
): Promise<void> {
  if (dryRun) {
    log.info(`[DRY RUN] Would lock repository: ${repoUrl}`)
    return
  }

  log.info(`Locking repository: ${repoUrl}`)

  const query = `
    UPDATE git.repositories
    SET "lockedAt" = NOW()
    WHERE id = $(repoId)
  `

  await postgres.result(query, { repoId })
  log.info(`✓ Repository locked: ${repoUrl}`)
}

/**
 * Unlock a repository after cleanup is complete
 */
async function unlockRepository(
  postgres: QueryExecutor,
  repoId: string,
  repoUrl: string,
  dryRun = false,
): Promise<void> {
  if (dryRun) {
    log.info(`[DRY RUN] Would unlock repository: ${repoUrl}`)
    return
  }

  log.info(`Unlocking repository: ${repoUrl}`)

  const query = `
    UPDATE git.repositories
    SET "lockedAt" = NULL
    WHERE id = $(repoId)
  `

  await postgres.result(query, { repoId })
  log.info(`✓ Repository unlocked: ${repoUrl}`)
}

/**
 * Delete maintainers for a fork repository from Postgres
 */
async function deleteMaintainersFromPostgres(
  postgres: QueryExecutor,
  repoId: string,
  repoUrl: string,
  dryRun = false,
): Promise<number> {
  if (dryRun) {
    log.info(`[DRY RUN] Querying maintainers for repository: ${repoUrl}`)
    const query = `
      SELECT COUNT(*) as count
      FROM "maintainersInternal"
      WHERE "repoId" = $(repoId)
    `
    const result = (await postgres.selectOne(query, { repoId })) as { count: string }
    const rowCount = parseInt(result.count, 10)
    log.info(`[DRY RUN] Would delete ${rowCount} maintainer(s) from Postgres`)
    return rowCount
  }

  log.info(`Deleting maintainers for repository: ${repoUrl}`)
  const query = `
    DELETE FROM "maintainersInternal"
    WHERE "repoId" = $(repoId)
  `
  const rowCount = await postgres.result(query, { repoId })
  log.info(`✓ Deleted ${rowCount} maintainer(s) from Postgres for repository ${repoUrl}`)
  return rowCount
}

/**
 * Delete maintainers from Tinybird using the delete API
 * Note: Tinybird deletions are async and may take time to reflect
 * See: https://www.tinybird.co/docs/classic/get-data-in/data-operations/replace-and-delete-data#delete-data-selectively
 */
async function deleteMaintainersFromTinybird(
  tinybird: TinybirdClient,
  repoId: string,
  repoUrl: string,
  dryRun = false,
): Promise<number> {
  if (dryRun) {
    log.info(`[DRY RUN] Querying maintainers from Tinybird for repository: ${repoUrl}`)
    try {
      const query = `SELECT COUNT(*) as count FROM maintainersInternal WHERE repoId = '${repoId}' FORMAT JSON`
      const result = await tinybird.executeSql<{ data: Array<{ count: string }> }>(query)
      const count = result.data.length > 0 ? parseInt(result.data[0].count, 10) : 0
      log.info(`[DRY RUN] Would delete ${count} maintainer(s) from Tinybird`)
      return count
    } catch (error) {
      log.error(`Failed to query maintainers from Tinybird: ${error.message}`)
      throw error
    }
  }

  log.info(`Deleting maintainers from Tinybird for repository: ${repoUrl}`)

  try {
    // Delete from maintainersInternal datasource using repoId
    log.info('Deleting from maintainersInternal datasource...')
    const deleteCondition = `repoId = '${repoId}'`
    const jobResponse = await tinybird.deleteDatasource('maintainersInternal', deleteCondition)

    log.info(
      `✓ Submitted deletion job to Tinybird (job_id: ${jobResponse.job_id}, job_url: ${jobResponse.job_url})`,
    )
    log.info(
      `  Note: Deletions are async and may take time to complete. Check job status at: ${jobResponse.job_url}`,
    )
    return 0 // Tinybird deletion is async, so we can't return actual count
  } catch (error) {
    log.error(`Failed to delete maintainers from Tinybird: ${error.message}`)
    throw error
  }
}

/**
 * Query activity IDs from Tinybird for a fork repository
 * This must be done before deletion because Tinybird deletions are asynchronous
 */
async function queryActivityIds(
  tinybird: TinybirdClient,
  segmentId: string,
  channel: string,
): Promise<string[]> {
  log.info(`Querying activity IDs from Tinybird for segment: ${segmentId}, channel: ${channel}`)

  try {
    const query = `SELECT DISTINCT activityId FROM activityRelations WHERE segmentId = '${segmentId}' AND channel = '${channel}' AND platform = 'git' FORMAT JSON`
    const result = await tinybird.executeSql<{ data: Array<{ activityId: string }> }>(query)

    const activityIds = result.data.map((row) => row.activityId)
    log.info(`Found ${activityIds.length} activity ID(s) in Tinybird`)
    return activityIds
  } catch (error) {
    log.error(`Failed to query activity IDs from Tinybird: ${error.message}`)
    throw error
  }
}

/**
 * Helper function to trigger a deletion job with retry on 429
 */
async function triggerDeletionJob(
  tinybird: TinybirdClient,
  datasourceName: string,
  deleteCondition: string,
  triggeredJobIds: string[],
): Promise<DeletionStatus> {
  try {
    log.info(`Triggering deletion job for ${datasourceName} datasource...`)
    const jobResponse = await tinybird.deleteDatasource(
      datasourceName,
      deleteCondition,
      true,
      false, // Don't wait
    )
    log.info(`✓ Triggered deletion job for ${datasourceName} (job_id: ${jobResponse.job_id})`)
    triggeredJobIds.push(jobResponse.job_id)
    return {
      success: true,
      jobId: jobResponse.job_id,
    }
  } catch (error) {
    log.error(`Failed to trigger deletion job for ${datasourceName} datasource: ${error.message}`)

    // If we hit 429, wait for one job to complete and retry
    if (error.message?.includes('429') && triggeredJobIds.length > 0) {
      log.info(`Hit rate limit, waiting for one job to complete before retrying...`)
      await tinybird.waitForJobs([triggeredJobIds[0]])
      triggeredJobIds.shift() // Remove the completed job

      // Retry the deletion
      try {
        log.info(`Retrying deletion job for ${datasourceName} datasource...`)
        const jobResponse = await tinybird.deleteDatasource(
          datasourceName,
          deleteCondition,
          true,
          false,
        )
        log.info(`✓ Triggered deletion job for ${datasourceName} (job_id: ${jobResponse.job_id})`)
        triggeredJobIds.push(jobResponse.job_id)
        return {
          success: true,
          jobId: jobResponse.job_id,
        }
      } catch (retryError) {
        log.error(`Failed to retry deletion job for ${datasourceName}: ${retryError.message}`)
        return {
          success: false,
          error: retryError.message,
        }
      }
    }

    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Delete activities from Tinybird using the delete API
 * Note: Tinybird deletions are async and may take time to reflect
 * See: https://www.tinybird.co/docs/classic/get-data-in/data-operations/replace-and-delete-data#delete-data-selectively
 */
async function deleteActivitiesFromTinybird(
  tinybird: TinybirdClient,
  activityIds: string[],
  dryRun = false,
): Promise<{
  activities: DeletionStatus
  activities_deduplicated_ds: DeletionStatus
  activityRelations: DeletionStatus
  activityRelations_deduplicated_cleaned_ds: DeletionStatus
}> {
  const results = {
    activities: { success: false } as DeletionStatus,
    activities_deduplicated_ds: { success: false } as DeletionStatus,
    activityRelations: { success: false } as DeletionStatus,
    activityRelations_deduplicated_cleaned_ds: { success: false } as DeletionStatus,
  }

  if (activityIds.length === 0) {
    log.info('No activities to delete from Tinybird')
    return results
  }

  if (dryRun) {
    log.info(`[DRY RUN] Would delete ${activityIds.length} activities from Tinybird`)
    log.info(
      `[DRY RUN] Would delete from 'activities' datasource: ${activityIds.length} activity(ies)`,
    )
    log.info(
      `[DRY RUN] Would delete from 'activities_deduplicated_ds' datasource: ${activityIds.length} activity(ies)`,
    )
    log.info(
      `[DRY RUN] Would delete from 'activityRelations' datasource: ${activityIds.length} relation(s)`,
    )
    log.info(
      `[DRY RUN] Would delete from 'activityRelations_deduplicated_cleaned_ds' datasource: ${activityIds.length} relation(s)`,
    )
    return {
      activities: { success: true },
      activities_deduplicated_ds: { success: true },
      activityRelations: { success: true },
      activityRelations_deduplicated_cleaned_ds: { success: true },
    }
  }

  log.info(`Deleting ${activityIds.length} activities from Tinybird...`)

  // Format activity IDs for SQL IN clause
  const idsString = activityIds.map((id) => `'${id}'`).join(',')

  // Track triggered job IDs to wait for one if we hit 429
  const triggeredJobIds: string[] = []

  // Trigger all delete jobs using the helper function
  results.activities = await triggerDeletionJob(
    tinybird,
    'activities',
    `id IN (${idsString})`,
    triggeredJobIds,
  )

  results.activities_deduplicated_ds = await triggerDeletionJob(
    tinybird,
    'activities_deduplicated_ds',
    `id IN (${idsString})`,
    triggeredJobIds,
  )

  results.activityRelations = await triggerDeletionJob(
    tinybird,
    'activityRelations',
    `activityId IN (${idsString})`,
    triggeredJobIds,
  )

  results.activityRelations_deduplicated_cleaned_ds = await triggerDeletionJob(
    tinybird,
    'activityRelations_deduplicated_cleaned_ds',
    `activityId IN (${idsString})`,
    triggeredJobIds,
  )

  log.info(`✓ All deletion jobs triggered (${triggeredJobIds.length} running in background)`)

  return results
}

/**
 * Delete activity relations from Postgres
 */
async function deleteActivityRelationsFromPostgres(
  postgres: QueryExecutor,
  activityIds: string[],
  dryRun = false,
): Promise<DeletionStatus> {
  if (activityIds.length === 0) {
    log.info(`No activity IDs to ${dryRun ? 'query' : 'delete'} from Postgres`)
    return { success: true }
  }

  try {
    if (dryRun) {
      log.info(`[DRY RUN] Querying ${activityIds.length} activity relations from Postgres...`)
      const query = `
        SELECT COUNT(*) as count
        FROM "activityRelations"
        WHERE "activityId" IN ($(activityIds:csv))
      `
      const result = (await postgres.selectOne(query, { activityIds })) as { count: string }
      const rowCount = parseInt(result.count, 10)
      log.info(`[DRY RUN] Would delete ${rowCount} activity relation(s) from Postgres`)
      return { success: true }
    }

    log.info(`Deleting ${activityIds.length} activity relations from Postgres...`)
    const query = `
      DELETE FROM "activityRelations"
      WHERE "activityId" IN ($(activityIds:csv))
    `
    const rowCount = await postgres.result(query, { activityIds })
    log.info(`✓ Deleted ${rowCount} activity relation(s) from Postgres`)
    return { success: true }
  } catch (error) {
    log.error(`Failed to delete activity relations from Postgres: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Process cleanup for a single fork repository
 */
async function cleanupForkRepository(
  clients: DatabaseClients,
  repo: ForkRepository,
  dryRun = false,
  tbToken?: string,
): Promise<void> {
  if (dryRun) {
    log.info(`\n${'='.repeat(80)}`)
    log.info(`[DRY RUN MODE] Processing: ${repo.url}`)
    log.info(`${'='.repeat(80)}`)
  } else {
    log.info(`\n${'='.repeat(80)}`)
    log.info(`Processing: ${repo.url}`)
    log.info(`${'='.repeat(80)}`)
  }

  // Lock repository to prevent concurrent operations
  await lockRepository(clients.postgres, repo.id, repo.url, dryRun)

  try {
    // Initialize Tinybird client once for this repository
    const tinybird = new TinybirdClient(tbToken)

    // Step 1: Delete maintainers from all systems
    log.info('Deleting maintainers from all systems...')
    const maintainersDeletedPostgres = await deleteMaintainersFromPostgres(
      clients.postgres,
      repo.id,
      repo.url,
      dryRun,
    )
    const maintainersDeletedTinybird = await deleteMaintainersFromTinybird(
      tinybird,
      repo.id,
      repo.url,
      dryRun,
    )

    // Step 2: Query activity IDs from Tinybird
    const activityIds = await queryActivityIds(tinybird, repo.segmentId, repo.url)
    log.info(`Found ${activityIds.length} activity ID(s) to ${dryRun ? 'query' : 'delete'}`)

    if (activityIds.length === 0) {
      log.info('No activities to delete, skipping deletion steps')
      log.info(`✓ Completed ${dryRun ? 'dry run for' : 'cleanup for'} ${repo.url}`)
      log.info(
        `  - Maintainers ${dryRun ? 'found' : 'deleted'} (Postgres): ${maintainersDeletedPostgres}`,
      )
      log.info(
        `  - Maintainers ${dryRun ? 'found' : 'deleted'} (Tinybird): ${maintainersDeletedTinybird}`,
      )
      return
    }

    // Process activities in batches of 2000
    const BATCH_SIZE = 2000
    const batches: string[][] = []
    for (let i = 0; i < activityIds.length; i += BATCH_SIZE) {
      batches.push(activityIds.slice(i, i + BATCH_SIZE))
    }

    log.info(
      `Processing ${activityIds.length} activities in ${batches.length} batch(es) of up to ${BATCH_SIZE}`,
    )

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      log.info(
        `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} activities)...`,
      )

      // Step 3: Delete from Postgres
      const postgresStatus = await deleteActivityRelationsFromPostgres(
        clients.postgres,
        batch,
        dryRun,
      )

      // Step 4: Delete from Tinybird last (source of truth - delete last so we can retry if needed)
      const tinybirdStatuses = await deleteActivitiesFromTinybird(tinybird, batch, dryRun)

      // Create batch result JSON
      const batchResult: BatchResult = {
        batchNumber: `${batchIndex + 1}/${batches.length}`,
        deletions: {
          postgres: postgresStatus,
          tinybird: tinybirdStatuses,
        },
      }

      // Write batch result to JSON file in /tmp
      const jsonFilePath = path.join('/tmp', `batch${batchIndex + 1}_${batches.length}.json`)
      try {
        fs.writeFileSync(jsonFilePath, JSON.stringify(batchResult, null, 2), 'utf-8')
        log.info(`✓ Batch results saved to: ${jsonFilePath}`)
      } catch (error) {
        log.error(`Failed to write batch results to ${jsonFilePath}: ${error.message}`)
      }

      log.info(`✓ Completed batch ${batchIndex + 1}/${batches.length}`)
    }

    log.info(`✓ Completed ${dryRun ? 'dry run for' : 'cleanup for'} ${repo.url}`)
    log.info(
      `  - Maintainers ${dryRun ? 'found' : 'deleted'} (Postgres): ${maintainersDeletedPostgres}`,
    )
    log.info(
      `  - Maintainers ${dryRun ? 'found' : 'deleted'} (Tinybird): ${maintainersDeletedTinybird}`,
    )
    log.info(`  - Activities ${dryRun ? 'found' : 'deleted'}: ${activityIds.length}`)
  } catch (error) {
    log.error(`Failed to cleanup repository ${repo.url}: ${error.message}`)
    throw error
  } finally {
    // Always unlock repository, even if cleanup failed
    await unlockRepository(clients.postgres, repo.id, repo.url, dryRun)
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

  // Remove flags and their values from args to get URLs
  const urls = args.filter(
    (arg, index) =>
      index !== dryRunIndex &&
      index !== tbTokenIndex &&
      (tbTokenIndex === -1 || index !== tbTokenIndex + 1),
  )

  if (urls.length === 0) {
    log.error(`
      Usage:
        # Via package.json script (recommended):
        pnpm run cleanup-fork-activities -- <repo-url> [<repo-url> ...] [--dry-run] [--tb-token <token>]
        
        # Or directly with tsx:
        npx tsx src/bin/cleanup-fork-activities-and-maintainers.ts <repo-url> [<repo-url> ...] [--dry-run] [--tb-token <token>]
      
      Arguments:
        repo-url: One or more repository URLs to clean up
        --dry-run: (optional) Display what would be deleted without actually deleting anything
        --tb-token: (optional) Tinybird API token to use (overrides CROWD_TINYBIRD_ACTIVITIES_TOKEN environment variable)
      
      Examples:
        # Clean up a single repository
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1
        
        # Clean up multiple repositories
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 https://github.com/owner/repo2
        
        # Dry run to preview what would be deleted
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 --dry-run
        
        # Use custom Tinybird token
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 --tb-token your-token-here
      
      Note: 
        - URLs must exist in git.repositories table
        - Repository must be a fork (forkedFrom field must not be null)
    `)
    process.exit(1)
  }

  if (dryRun) {
    log.info(`\n${'='.repeat(80)}`)
    log.info('🧪 DRY RUN MODE - No data will be deleted')
    log.info(`${'='.repeat(80)}\n`)
  }

  try {
    log.info(`Processing ${urls.length} repository URL(s)`)

    // Initialize database clients
    const clients = await initDatabaseClients()

    // Process cleanup workflow
    log.info(`\n${'='.repeat(80)}`)
    log.info(`Starting ${dryRun ? 'dry run (preview)' : 'cleanup'} workflow`)
    log.info(`${'='.repeat(80)}`)

    let successCount = 0
    let failureCount = 0
    const failedRepos: string[] = []

    for (const url of urls) {
      try {
        // Lookup and cleanup in the same loop
        const repo = await lookupForkRepository(clients.postgres, url)
        await cleanupForkRepository(clients, repo, dryRun, tbToken)
        successCount++
      } catch (error) {
        failureCount++
        failedRepos.push(url)
        log.error(`Failed to process ${url}: ${error.message}`)
        // Continue with next repository instead of stopping
      }
    }

    // Summary
    log.info(`\n${'='.repeat(80)}`)
    log.info('Cleanup Summary')
    log.info(`${'='.repeat(80)}`)
    log.info(`✓ Successfully processed: ${successCount}/${urls.length}`)
    if (failureCount > 0) {
      log.warn(`✗ Failed: ${failureCount}/${urls.length}`)
      log.warn('Failed repositories:')
      failedRepos.forEach((url) => log.warn(`  - ${url}`))
    }

    process.exit(failureCount > 0 ? 1 : 0)
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
