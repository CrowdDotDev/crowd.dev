/**
 * Cleanup and Improve Collections Script
                                    
 * Problem                                                                                                                                                               
 * At the moment, we have around 2100 collections in the database. However, we are about to release a new concept of community collections, which are managed by the community. Apart from these collections, we also offer a set of curated collections, which are managed by the Linux Foundation team. We want to avoid having 2100 marked as curated, not only because it's a lot of collections, but also because most of them have shown to be quite empty, or not meaningful.
 * Solution

 * We have run an analysis on all of the collections that are not LF Foundations, and have identified the following:
 * - 892 collections can be deleted.
 * - 840 collections will be merged into existing collections.
 * - 459 collections will be kept with small adjustments in naming and description.

 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run cleanup-collections -- --csv-file <path> [--dry-run]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/cleanup-collections.ts --csv-file <path> [--dry-run]
 *
 * Options:
 *   --csv-file <path>  Path to the CSV file with collection actions
 *   --dry-run          Display what would change without actually modifying anything
 *
 * CSV columns:
 *   collection_id, collection_name, action (MERGE_INTO|KEEP|DELETE),
 *   merge_target, suggested_name, suggested_description, reason
 *
 * Environment Variables Required:
 *   CROWD_DB_WRITE_HOST - Postgres write host
 *   CROWD_DB_PORT       - Postgres port
 *   CROWD_DB_USERNAME   - Postgres username
 *   CROWD_DB_PASSWORD   - Postgres password
 *   CROWD_DB_DATABASE   - Postgres database name
 */
import * as fs from 'fs'
import * as readline from 'readline'

import {
  CollectionField,
  disconnectProjectsAndCollections,
  findCollectionProjectConnections,
  queryCollectionById,
  updateCollection,
} from '@crowd/data-access-layer/src/collections'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('cleanup-collections-script')

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Types

type Action = 'DELETE' | 'MERGE_INTO' | 'KEEP'

interface CsvRow {
  collection_id: string
  collection_name: string
  action: Action
  merge_target: string
  suggested_name: string
  suggested_description: string
  reason: string
}

interface ProcessSummary {
  deleted: number
  merged: number
  kept: number
  errors: number
  startTime: string
  endTime: string
  dryRun: boolean
}

// DB helpers

async function initPostgresClient(): Promise<QueryExecutor> {
  log.info('Initializing Postgres connection...')
  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const qx = pgpQx(dbConnection)
  log.info('Postgres connection established')
  return qx
}

async function getCollectionName(qx: QueryExecutor, id: string): Promise<string> {
  try {
    const result = await queryCollectionById(qx, id, [CollectionField.NAME])
    return result?.name ?? id
  } catch {
    return id
  }
}

async function getProjectsInCollection(
  qx: QueryExecutor,
  collectionId: string,
): Promise<{ id: string; name: string }[]> {
  const connections = await findCollectionProjectConnections(qx, { collectionIds: [collectionId] })
  if (connections.length === 0) return []

  const projectIds = connections.map((c) => c.insightsProjectId)
  const rows = await qx.select(
    `SELECT id, name FROM "insightsProjects" WHERE id IN ($(projectIds:csv)) AND "deletedAt" IS NULL`,
    { projectIds },
  )
  return rows as { id: string; name: string }[]
}

async function softDeleteCollectionProjects(
  qx: QueryExecutor,
  collectionId: string,
): Promise<void> {
  await disconnectProjectsAndCollections(qx, { collectionId })
}

async function softDeleteCollection(qx: QueryExecutor, collectionId: string): Promise<void> {
  await qx.result(
    `UPDATE collections SET "deletedAt" = NOW(), "updatedAt" = NOW() WHERE id = $(id) AND "deletedAt" IS NULL`,
    { id: collectionId },
  )
}

async function migrateProjectsToTargetCollection(
  qx: QueryExecutor,
  sourceCollectionId: string,
  targetCollectionId: string,
): Promise<number> {
  // Get active connections for source collection
  const connections = await findCollectionProjectConnections(qx, {
    collectionIds: [sourceCollectionId],
  })
  if (connections.length === 0) return 0

  // Get existing project ids in target to avoid duplicates
  const targetConnections = await findCollectionProjectConnections(qx, {
    collectionIds: [targetCollectionId],
  })
  const alreadyInTarget = new Set(targetConnections.map((c) => c.insightsProjectId))

  const toMigrate = connections.filter((c) => !alreadyInTarget.has(c.insightsProjectId))

  if (toMigrate.length === 0) return 0

  // Update collectionId to point to target, refresh updatedAt
  await qx.result(
    `
      UPDATE "collectionsInsightsProjects"
      SET "collectionId" = $(targetCollectionId),
          "updatedAt" = NOW()
      WHERE id IN ($(ids:csv))
        AND "deletedAt" IS NULL
    `,
    {
      targetCollectionId,
      ids: toMigrate.map((c) => c.id),
    },
  )

  return toMigrate.length
}

// CSV parsing

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((l) => l.trim().length > 0)

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < headers.length) continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() ?? ''
    })

    rows.push(row as unknown as CsvRow)
  }

  return rows
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values
}

// Confirmation prompt

async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes')
    })
  })
}

// Dry run output

async function printDryRun(qx: QueryExecutor, rows: CsvRow[]): Promise<void> {
  const toDelete = rows.filter((r) => r.action === 'DELETE')
  const toMerge = rows.filter((r) => r.action === 'MERGE_INTO')
  const toKeep = rows.filter((r) => r.action === 'KEEP')

  log.info(`\n${'='.repeat(80)}`)
  log.info(`[DRY RUN] Collections to DELETE (${toDelete.length})`)
  log.info(`${'='.repeat(80)}`)
  for (const row of toDelete) {
    log.info(
      `  - Collection "${row.collection_name}" (${row.collection_id}) will be deleted because: ${row.reason}`,
    )
  }

  log.info(`\n${'='.repeat(80)}`)
  log.info(`[DRY RUN] Collections to MERGE (${toMerge.length})`)
  log.info(`${'='.repeat(80)}`)
  for (const row of toMerge) {
    const targetName = await getCollectionName(qx, row.merge_target)
    const projects = await getProjectsInCollection(qx, row.collection_id)
    const projectNames = projects.map((p) => p.name).join(', ') || '(none)'
    log.info(
      `  - Collection "${row.collection_name}" (${row.collection_id}) will be merged into "${targetName}" (${row.merge_target}) because: ${row.reason}`,
    )
    log.info(`    Projects to be moved: ${projectNames}`)
  }

  log.info(`\n${'='.repeat(80)}`)
  log.info(`[DRY RUN] Collections to KEEP with adjustments (${toKeep.length})`)
  log.info(`${'='.repeat(80)}`)
  for (const row of toKeep) {
    const existing = await queryCollectionById(qx, row.collection_id, [
      CollectionField.NAME,
      CollectionField.DESCRIPTION,
    ])
    log.info(
      `  - Collection "${row.collection_name}" (${row.collection_id}) will be kept with adjustments:`,
    )
    log.info(`      Old Name:        ${existing?.name ?? '(not found)'}`)
    log.info(`      New Name:        ${row.suggested_name}`)
    log.info(`      Old Description: ${existing?.description ?? '(none)'}`)
    log.info(`      New Description: ${row.suggested_description}`)
    log.info(`      Reason:          ${row.reason}`)
  }
}

// Real run

async function runDeletions(
  qx: QueryExecutor,
  rows: CsvRow[],
  dryRun: boolean,
): Promise<{ deleted: number; errors: number }> {
  const toDelete = rows.filter((r) => r.action === 'DELETE')
  let deleted = 0
  let errors = 0

  log.info(`\n${'='.repeat(80)}`)
  log.info(`Deleting ${toDelete.length} collection(s)...`)
  log.info(`${'='.repeat(80)}`)

  for (const row of toDelete) {
    try {
      if (!dryRun) {
        await softDeleteCollectionProjects(qx, row.collection_id)
        await softDeleteCollection(qx, row.collection_id)
        await sleep(500)
      }
      log.info(`  ✓ Deleted "${row.collection_name}" (${row.collection_id})`)
      deleted++
    } catch (err) {
      log.error(
        `  ✗ Failed to delete "${row.collection_name}" (${row.collection_id}): ${err.message}`,
      )
      errors++
    }
  }

  return { deleted, errors }
}

async function runMerges(
  qx: QueryExecutor,
  rows: CsvRow[],
  dryRun: boolean,
): Promise<{ merged: number; errors: number }> {
  const toMerge = rows.filter((r) => r.action === 'MERGE_INTO')
  let merged = 0
  let errors = 0

  log.info(`\n${'='.repeat(80)}`)
  log.info(`Merging ${toMerge.length} collection(s)...`)
  log.info(`${'='.repeat(80)}`)

  for (const row of toMerge) {
    try {
      const targetName = await getCollectionName(qx, row.merge_target)
      if (!dryRun) {
        const movedCount = await migrateProjectsToTargetCollection(
          qx,
          row.collection_id,
          row.merge_target,
        )
        await softDeleteCollection(qx, row.collection_id)
        await sleep(500)
        log.info(
          `  ✓ Merged "${row.collection_name}" (${row.collection_id}) into "${targetName}" (${row.merge_target}) — ${movedCount} project(s) moved`,
        )
      } else {
        log.info(
          `  ✓ Would merge "${row.collection_name}" (${row.collection_id}) into "${targetName}" (${row.merge_target})`,
        )
      }
      merged++
    } catch (err) {
      log.error(
        `  ✗ Failed to merge "${row.collection_name}" (${row.collection_id}): ${err.message}`,
      )
      errors++
    }
  }

  return { merged, errors }
}

async function runKeeps(
  qx: QueryExecutor,
  rows: CsvRow[],
  dryRun: boolean,
): Promise<{ kept: number; errors: number }> {
  const toKeep = rows.filter((r) => r.action === 'KEEP')
  let kept = 0
  let errors = 0

  log.info(`\n${'='.repeat(80)}`)
  log.info(`Updating ${toKeep.length} collection(s)...`)
  log.info(`${'='.repeat(80)}`)

  for (const row of toKeep) {
    try {
      if (!dryRun) {
        await updateCollection(qx, row.collection_id, {
          name: row.suggested_name,
          description: row.suggested_description,
        })
        await sleep(500)
      }
      log.info(
        `  ✓ Updated "${row.collection_name}" (${row.collection_id}) → name: "${row.suggested_name}"`,
      )
      kept++
    } catch (err) {
      log.error(
        `  ✗ Failed to update "${row.collection_name}" (${row.collection_id}): ${err.message}`,
      )
      errors++
    }
  }

  return { kept, errors }
}

// Main

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    log.info(`
      Usage:
        pnpm run cleanup-collections -- --csv-file <path> [--dry-run]
        npx tsx src/bin/cleanup-collections.ts --csv-file <path> [--dry-run]

      Options:
        --csv-file <path>  Path to the CSV file with collection actions (required)
        --dry-run          Preview changes without modifying the database
    `)
    process.exit(0)
  }

  const dryRun = args.includes('--dry-run')

  const csvFileIndex = args.indexOf('--csv-file')
  if (csvFileIndex === -1 || csvFileIndex + 1 >= args.length) {
    log.error('Error: --csv-file is required')
    process.exit(1)
  }
  const csvFilePath = args[csvFileIndex + 1]

  if (!fs.existsSync(csvFilePath)) {
    log.error(`Error: CSV file not found at path: ${csvFilePath}`)
    process.exit(1)
  }

  log.info(`\n${'='.repeat(80)}`)
  log.info('Cleanup Collections Script')
  log.info(`${'='.repeat(80)}`)
  log.info(`CSV file: ${csvFilePath}`)
  log.info(
    `Mode: ${dryRun ? 'DRY RUN (no data will be modified)' : 'LIVE (data will be modified)'}`,
  )
  log.info(`${'='.repeat(80)}\n`)

  let rows: CsvRow[]
  try {
    rows = parseCsv(csvFilePath)
  } catch (err) {
    log.error(`Failed to parse CSV: ${err.message}`)
    process.exit(1)
  }

  const toDelete = rows.filter((r) => r.action === 'DELETE').length
  const toMerge = rows.filter((r) => r.action === 'MERGE_INTO').length
  const toKeep = rows.filter((r) => r.action === 'KEEP').length

  log.info(`Parsed ${rows.length} row(s) from CSV:`)
  log.info(`  - DELETE:     ${toDelete}`)
  log.info(`  - MERGE_INTO: ${toMerge}`)
  log.info(`  - KEEP:       ${toKeep}`)

  const qx = await initPostgresClient()

  if (dryRun) {
    await printDryRun(qx, rows)
    log.info(`\n${'='.repeat(80)}`)
    log.info('[DRY RUN] Summary')
    log.info(`${'='.repeat(80)}`)
    log.info(`  Would delete:  ${toDelete}`)
    log.info(`  Would merge:   ${toMerge}`)
    log.info(`  Would update:  ${toKeep}`)
    log.info('\n[DRY RUN] No changes were made.')
    log.info(`${'='.repeat(80)}`)
    process.exit(0)
  }

  // Real run — ask for confirmation
  log.info('\nThe following operations will be performed:')
  log.info(`  - ${toDelete} collection(s) will be permanently soft-deleted`)
  log.info(`  - ${toMerge} collection(s) will be merged into their targets and soft-deleted`)
  log.info(`  - ${toKeep} collection(s) will have their name/description updated`)

  const confirmed = await askConfirmation('\nAre you sure you want to proceed?')
  if (!confirmed) {
    log.info('Aborted. No changes were made.')
    process.exit(0)
  }

  const startTime = new Date().toISOString()
  let totalErrors = 0

  const { deleted, errors: deleteErrors } = await runDeletions(qx, rows, false)
  totalErrors += deleteErrors

  const { merged, errors: mergeErrors } = await runMerges(qx, rows, false)
  totalErrors += mergeErrors

  const { kept, errors: keepErrors } = await runKeeps(qx, rows, false)
  totalErrors += keepErrors

  const endTime = new Date().toISOString()

  const summary: ProcessSummary = {
    deleted,
    merged,
    kept,
    errors: totalErrors,
    startTime,
    endTime,
    dryRun: false,
  }

  log.info(`\n${'='.repeat(80)}`)
  log.info('Summary')
  log.info(`${'='.repeat(80)}`)
  log.info(`✓ Deleted:  ${summary.deleted}`)
  log.info(`✓ Merged:   ${summary.merged}`)
  log.info(`✓ Updated:  ${summary.kept}`)
  if (summary.errors > 0) {
    log.warn(`✗ Errors:   ${summary.errors}`)
  }
  log.info(`Duration: ${summary.startTime} → ${summary.endTime}`)

  process.exit(summary.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  log.error('Unexpected error:', err)
  process.exit(1)
})
