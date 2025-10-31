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
 * - Snowflake
 * - CDP Postgres
 *
 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run cleanup-fork-activities -- <repo-url> [<repo-url> ...] [--dry-run] [--skip-snowflake]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/cleanup-fork-activities-and-maintainers.ts <repo-url> [<repo-url> ...] [--dry-run] [--skip-snowflake]
 *
 * Options:
 *   --dry-run          Display what would be deleted without actually deleting anything
 *   --skip-snowflake   Skip all Snowflake operations (useful for testing without valid Snowflake credentials)
 *
 * Environment Variables Required:
 *   CROWD_DB_WRITE_HOST - Postgres write host
 *   CROWD_DB_PORT - Postgres port
 *   CROWD_DB_USERNAME - Postgres username
 *   CROWD_DB_PASSWORD - Postgres password
 *   CROWD_DB_DATABASE - Postgres database name
 *   CROWD_TINYBIRD_BASE_URL - Tinybird API base URL
 *   CROWD_TINYBIRD_ACTIVITIES_TOKEN - Tinybird API token
 *   CROWD_SNOWFLAKE_PRIVATE_KEY - Snowflake private key
 *   CROWD_SNOWFLAKE_ACCOUNT - Snowflake account
 *   CROWD_SNOWFLAKE_USERNAME - Snowflake username
 *   CROWD_SNOWFLAKE_DATABASE - Snowflake database
 *   CROWD_SNOWFLAKE_WAREHOUSE - Snowflake warehouse
 *   CROWD_SNOWFLAKE_ROLE - Snowflake role
 */
import { TinybirdClient, WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'
import { SnowflakeClient } from '@crowd/snowflake'

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
  snowflake: SnowflakeClient | null
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
 * Initialize Snowflake client
 */
function initSnowflakeClient(): SnowflakeClient {
  log.info('Initializing Snowflake client...')

  const client = new SnowflakeClient({
    privateKeyString: process.env['CROWD_SNOWFLAKE_PRIVATE_KEY'],
    account: process.env['CROWD_SNOWFLAKE_ACCOUNT'],
    username: process.env['CROWD_SNOWFLAKE_USERNAME'],
    database: process.env['CROWD_SNOWFLAKE_DATABASE'],
    warehouse: process.env['CROWD_SNOWFLAKE_WAREHOUSE'],
    role: process.env['CROWD_SNOWFLAKE_ROLE'],
    parentLog: log,
  })

  log.info('Snowflake client initialized')
  return client
}

/**
 * Initialize all database clients
 */
async function initDatabaseClients(skipSnowflake: boolean = false): Promise<DatabaseClients> {
  log.info('Initializing database clients...')

  const postgres = await initPostgresClient()
  let snowflake: SnowflakeClient | null = null

  if (skipSnowflake) {
    log.info('Skipping Snowflake client initialization (--skip-snowflake flag set)')
  } else {
    try {
      snowflake = initSnowflakeClient()
    } catch (error) {
      log.warn(`Failed to initialize Snowflake client: ${error.message}`)
      log.warn('Continuing without Snowflake support')
      snowflake = null
    }
  }

  log.info('All database clients initialized successfully')

  return {
    postgres,
    snowflake,
  }
}

/**
 * Lookup a single fork repository by URL
 */
async function lookupForkRepository(
  postgres: QueryExecutor,
  url: string,
): Promise<ForkRepository> {
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
 * Delete maintainers for a fork repository from Postgres
 */
async function deleteMaintainersFromPostgres(
  postgres: QueryExecutor,
  repoId: string,
  repoUrl: string,
  dryRun: boolean = false,
): Promise<number> {
  if (dryRun) {
    log.info(`[DRY RUN] Querying maintainers for repository: ${repoUrl}`)
    const query = `
      SELECT COUNT(*) as count
      FROM maintainersInternal
      WHERE "repoId" = $(repoId)
    `
    const result = (await postgres.selectOne(query, { repoId })) as { count: string }
    const rowCount = parseInt(result.count, 10)
    log.info(`[DRY RUN] Would delete ${rowCount} maintainer(s) from Postgres`)
    return rowCount
  }

  log.info(`Deleting maintainers for repository: ${repoUrl}`)
  const query = `
    DELETE FROM maintainersInternal
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
  dryRun: boolean = false,
): Promise<number> {
  if (dryRun) {
    log.info(`[DRY RUN] Querying maintainers from Tinybird for repository: ${repoUrl}`)
    try {
      const query = `SELECT COUNT(*) as count FROM maintainersInternal WHERE repoId = '${repoId}' FORMAT JSON`
      const result = await tinybird.rawSql<{ data: Array<{ count: string }> }>(query)
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
 * Delete maintainers from Snowflake
 */
async function deleteMaintainersFromSnowflake(
  snowflake: SnowflakeClient | null,
  repoId: string,
  repoUrl: string,
  dryRun: boolean = false,
): Promise<number> {
  if (!snowflake) {
    log.info('Skipping Snowflake maintainer deletion (Snowflake not available)')
    return 0
  }
  if (dryRun) {
    log.info(`[DRY RUN] Querying maintainers from Snowflake for repository: ${repoUrl}`)
    try {
      const query = `SELECT COUNT(*) as count FROM maintainersInternal WHERE repoId = '${repoId}'`
      const result = await snowflake.run<{ COUNT: string }>(query)
      const count = result.length > 0 ? parseInt(result[0].COUNT, 10) : 0
      log.info(`[DRY RUN] Would delete ${count} maintainer(s) from Snowflake`)
      return count
    } catch (error) {
      log.error(`Failed to query maintainers from Snowflake: ${error.message}`)
      throw error
    }
  }

  log.info(`Deleting maintainers from Snowflake for repository: ${repoUrl}`)
  try {
    log.info('Deleting from maintainersInternal table...')
    const query = `DELETE FROM maintainersInternal WHERE repoId = '${repoId}'`
    await snowflake.run(query)
    log.info(`✓ Deleted maintainers from Snowflake`)
    return 0 // Snowflake doesn't return count
  } catch (error) {
    log.error(`Failed to delete maintainers from Snowflake: ${error.message}`)
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
    const query = `SELECT activityId FROM activityRelations WHERE segmentId = '${segmentId}' AND channel = '${channel}' AND platform = 'git' FORMAT JSON`
    const result = await tinybird.rawSql<{ data: Array<{ activityId: string }> }>(query)

    const activityIds = result.data.map((row) => row.activityId)
    log.info(`Found ${activityIds.length} activity ID(s) in Tinybird`)
    return activityIds
  } catch (error) {
    log.error(`Failed to query activity IDs from Tinybird: ${error.message}`)
    throw error
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
  dryRun: boolean = false,
): Promise<void> {
  if (activityIds.length === 0) {
    log.info('No activities to delete from Tinybird')
    return
  }

  if (dryRun) {
    log.info(`[DRY RUN] Would delete ${activityIds.length} activities from Tinybird`)
    log.info(`[DRY RUN] Would delete from 'activities' datasource: ${activityIds.length} activity(ies)`)
    log.info(`[DRY RUN] Would delete from 'activityRelations' datasource: ${activityIds.length} relation(s)`)
    return
  }

  log.info(`Deleting ${activityIds.length} activities from Tinybird...`)

  // Format activity IDs for SQL IN clause
  const idsString = activityIds.map((id) => `'${id}'`).join(',')

  try {
    // Delete from activities datasource
    log.info('Deleting from activities datasource...')
    const activitiesDeleteCondition = `id IN (${idsString})`
    const activitiesJobResponse = await tinybird.deleteDatasource('activities', activitiesDeleteCondition)
    log.info(
      `✓ Submitted deletion job for activities (job_id: ${activitiesJobResponse.job_id})`,
    )

    // Delete from activityRelations datasource
    log.info('Deleting from activityRelations datasource...')
    const activityRelationsDeleteCondition = `activityId IN (${idsString})`
    const activityRelationsJobResponse = await tinybird.deleteDatasource(
      'activityRelations',
      activityRelationsDeleteCondition,
    )
    log.info(
      `✓ Submitted deletion job for activityRelations (job_id: ${activityRelationsJobResponse.job_id})`,
    )

    log.info(
      `✓ Submitted deletion jobs to Tinybird (note: deletions are async and may take time to complete)`,
    )
    log.info(`  Activities job URL: ${activitiesJobResponse.job_url}`)
    log.info(`  ActivityRelations job URL: ${activityRelationsJobResponse.job_url}`)
  } catch (error) {
    log.error(`Failed to delete activities from Tinybird: ${error.message}`)
    throw error
  }
}

/**
 * Delete activity relations from Postgres
 */
async function deleteActivityRelationsFromPostgres(
  postgres: QueryExecutor,
  activityIds: string[],
  dryRun: boolean = false,
): Promise<number> {
  if (activityIds.length === 0) {
    log.info(`No activity IDs to ${dryRun ? 'query' : 'delete'} from Postgres`)
    return 0
  }

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
    return rowCount
  }

  log.info(`Deleting ${activityIds.length} activity relations from Postgres...`)
  const query = `
    DELETE FROM "activityRelations"
    WHERE "activityId" IN ($(activityIds:csv))
  `
  const rowCount = await postgres.result(query, { activityIds })
  log.info(`✓ Deleted ${rowCount} activity relation(s) from Postgres`)
  return rowCount
}

/**
 * Delete activities and activity relations from Snowflake
 */
async function deleteActivitiesFromSnowflake(
  snowflake: SnowflakeClient | null,
  activityIds: string[],
  dryRun: boolean = false,
): Promise<void> {
  if (!snowflake) {
    log.info('Skipping Snowflake activity deletion (Snowflake not available)')
    return
  }

  if (activityIds.length === 0) {
    log.info('No activity IDs to delete from Snowflake')
    return
  }

  if (dryRun) {
    log.info(`[DRY RUN] Would delete ${activityIds.length} activities from Snowflake`)
    log.info(`[DRY RUN] Would delete from 'activityRelations' table: ${activityIds.length} relation(s)`)
    log.info(`[DRY RUN] Would delete from 'activities' table: ${activityIds.length} activity(ies)`)
    return
  }

  log.info(`Deleting ${activityIds.length} activities from Snowflake...`)

  // Format activity IDs for SQL IN clause
  const idsString = activityIds.map((id) => `'${id}'`).join(',')

  try {
    // Delete from activityRelations first (foreign key dependency)
    log.info('Deleting from activityRelations table...')
    const activityRelationsQuery = `DELETE FROM activityRelations WHERE activityId IN (${idsString})`
    await snowflake.run(activityRelationsQuery)

    // Delete from activities table
    log.info('Deleting from activities table...')
    const activitiesQuery = `DELETE FROM activities WHERE id IN (${idsString})`
    await snowflake.run(activitiesQuery)

    log.info(`✓ Deleted activities from Snowflake`)
  } catch (error) {
    log.error(`Failed to delete activities from Snowflake: ${error.message}`)
    throw error
  }
}

/**
 * Process cleanup for a single fork repository
 */
async function cleanupForkRepository(
  clients: DatabaseClients,
  repo: ForkRepository,
  dryRun: boolean = false,
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

  try {
    // Initialize Tinybird client once for this repository
    const tinybird = new TinybirdClient()

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
    const maintainersDeletedSnowflake = await deleteMaintainersFromSnowflake(
      clients.snowflake,
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
      log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Postgres): ${maintainersDeletedPostgres}`)
      if (clients.snowflake) {
        log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Snowflake): ${maintainersDeletedSnowflake}`)
      }
      log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Tinybird): ${maintainersDeletedTinybird}`)
      return
    }

    // Step 3: Delete from Tinybird
    await deleteActivitiesFromTinybird(tinybird, activityIds, dryRun)

    // Step 4: Delete from Postgres
    const activityRelationsDeleted = await deleteActivityRelationsFromPostgres(
      clients.postgres,
      activityIds,
      dryRun,
    )

    // Step 5: Delete from Snowflake
    await deleteActivitiesFromSnowflake(clients.snowflake, activityIds, dryRun)

    log.info(`✓ Completed ${dryRun ? 'dry run for' : 'cleanup for'} ${repo.url}`)
    log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Postgres): ${maintainersDeletedPostgres}`)
    if (clients.snowflake) {
      log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Snowflake): ${maintainersDeletedSnowflake}`)
    }
    log.info(`  - Maintainers ${dryRun ? 'found' : 'deleted'} (Tinybird): ${maintainersDeletedTinybird}`)
    log.info(`  - Activities ${dryRun ? 'found' : 'deleted'}: ${activityIds.length}`)
    log.info(`  - Activity relations ${dryRun ? 'found' : 'deleted'}: ${activityRelationsDeleted}`)
  } catch (error) {
    log.error(`Failed to cleanup repository ${repo.url}: ${error.message}`)
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
  const skipSnowflakeIndex = args.indexOf('--skip-snowflake')
  const dryRun = dryRunIndex !== -1
  const skipSnowflake = skipSnowflakeIndex !== -1
  
  // Remove flags from args to get URLs
  const urls = args.filter(
    (arg, index) => index !== dryRunIndex && index !== skipSnowflakeIndex
  )

  if (urls.length === 0) {
    log.error(`
      Usage:
        # Via package.json script (recommended):
        pnpm run cleanup-fork-activities -- <repo-url> [<repo-url> ...] [--dry-run] [--skip-snowflake]
        
        # Or directly with tsx:
        npx tsx src/bin/cleanup-fork-activities-and-maintainers.ts <repo-url> [<repo-url> ...] [--dry-run] [--skip-snowflake]
      
      Arguments:
        repo-url: One or more repository URLs to clean up
        --dry-run: (optional) Display what would be deleted without actually deleting anything
        --skip-snowflake: (optional) Skip all Snowflake operations (useful for testing without valid Snowflake credentials)
      
      Examples:
        # Clean up a single repository
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1
        
        # Clean up multiple repositories
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 https://github.com/owner/repo2
        
        # Dry run to preview what would be deleted
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 --dry-run
        
        # Skip Snowflake operations (for testing without Snowflake credentials)
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 --skip-snowflake
        
        # Combine flags
        pnpm run cleanup-fork-activities -- https://github.com/owner/repo1 --dry-run --skip-snowflake
      
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

  if (skipSnowflake) {
    log.info(`\n${'='.repeat(80)}`)
    log.info('⚠️  SNOWFLAKE DISABLED - Skipping all Snowflake operations')
    log.info(`${'='.repeat(80)}\n`)
  }

  try {
    log.info(`Processing ${urls.length} repository URL(s)`)

    // Initialize database clients
    const clients = await initDatabaseClients(skipSnowflake)

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
        await cleanupForkRepository(clients, repo, dryRun)
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
