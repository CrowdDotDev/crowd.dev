/**
 * Reassign Insights Projects Script
 *
 * Reassigns insights projects from their current collection to a suggested collection,
 * based on a CSV input file.
 *
 * Usage:
 *   # Via package.json script (recommended):
 *   pnpm run reassign-insights-projects -- --csv-file <path> [--dry-run]
 *
 *   # Or directly with tsx:
 *   npx tsx src/bin/reassign-insights-projects.ts --csv-file <path> [--dry-run]
 *
 * Options:
 *   --csv-file <path>  Path to the CSV file with project reassignment data
 *   --dry-run          Display what would change without actually modifying anything
 *
 * CSV columns:
 *   project_id, project_name, collection_id, collection_name,
 *   collection_action (KEEP|MERGE_INTO|DELETE), verdict (OK|REASSIGN),
 *   suggested_collection_id, reason
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
  connectProjectsAndCollections,
  disconnectProjectsAndCollections,
  queryCollectionById,
} from '@crowd/data-access-layer/src/collections'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

const log = getServiceChildLogger('reassign-insights-projects-script')

// Types

type Verdict = 'OK' | 'REASSIGN'
type CollectionAction = 'KEEP' | 'MERGE_INTO' | 'DELETE'

interface CsvRow {
  project_id: string
  project_name: string
  collection_id: string
  collection_name: string
  collection_action: CollectionAction
  verdict: Verdict
  suggested_collection_id: string
  reason: string
}

interface ProcessSummary {
  ok: number
  reassigned: number
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

async function getCollectionName(qx: QueryExecutor, id: string): Promise<string | null> {
  try {
    const result = await queryCollectionById(qx, id, [CollectionField.NAME])
    return result?.name ?? null
  } catch {
    return null
  }
}

async function reassignProject(
  qx: QueryExecutor,
  projectId: string,
  fromCollectionId: string,
  toCollectionId: string,
): Promise<void> {
  await disconnectProjectsAndCollections(qx, {
    collectionId: fromCollectionId,
    insightsProjectId: projectId,
  })

  await connectProjectsAndCollections(qx, [
    {
      insightsProjectId: projectId,
      collectionId: toCollectionId,
      starred: false,
    },
  ])
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

// Processing

async function processRows(
  qx: QueryExecutor,
  rows: CsvRow[],
  dryRun: boolean,
): Promise<{ ok: number; reassigned: number; errors: number }> {
  let ok = 0
  let reassigned = 0
  let errors = 0

  for (const row of rows) {
    if (row.verdict === 'OK') {
      log.info(
        `  [OK] Insights Project "${row.project_name}" (${row.project_id}) is OK — no action needed`,
      )
      ok++
      continue
    }

    if (row.verdict === 'REASSIGN') {
      if (!row.suggested_collection_id) {
        log.error(
          `  [ERROR] Migration cannot be completed for Insights Project "${row.project_name}" (${row.project_id}): suggested_collection_id is empty`,
        )
        errors++
        continue
      }

      try {
        const targetName = await getCollectionName(qx, row.suggested_collection_id)

        if (targetName === null) {
          log.error(
            `  [ERROR] Migration cannot be completed for Insights Project "${row.project_name}" (${row.project_id}): suggested collection (${row.suggested_collection_id}) not found`,
          )
          errors++
          continue
        }

        if (dryRun) {
          log.info(
            `  [DRY RUN] Would reassign Insights Project "${row.project_name}" (${row.project_id}) from collection "${row.collection_name}" (${row.collection_id}) to collection "${targetName}" (${row.suggested_collection_id})`,
          )
        } else {
          await reassignProject(qx, row.project_id, row.collection_id, row.suggested_collection_id)
          log.info(
            `  [REASSIGNED] Insights Project "${row.project_name}" (${row.project_id}) has been reassigned to collection "${targetName}" (${row.suggested_collection_id})`,
          )
        }
        reassigned++
      } catch (err) {
        log.error(
          `  [ERROR] Failed to reassign Insights Project "${row.project_name}" (${row.project_id}): ${err.message}`,
        )
        errors++
      }
    }
  }

  return { ok, reassigned, errors }
}

// Main

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    log.info(`
      Usage:
        pnpm run reassign-insights-projects -- --csv-file <path> [--dry-run]
        npx tsx src/bin/reassign-insights-projects.ts --csv-file <path> [--dry-run]

      Options:
        --csv-file <path>  Path to the CSV file with project reassignment data (required)
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
  log.info('Reassign Insights Projects Script')
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

  const toOk = rows.filter((r) => r.verdict === 'OK').length
  const toReassign = rows.filter((r) => r.verdict === 'REASSIGN').length

  log.info(`Parsed ${rows.length} row(s) from CSV:`)
  log.info(`  - OK:       ${toOk}`)
  log.info(`  - REASSIGN: ${toReassign}`)

  const qx = await initPostgresClient()

  if (!dryRun) {
    log.info('\nThe following operations will be performed:')
    log.info(`  - ${toReassign} project(s) will be reassigned to a new collection`)

    const confirmed = await askConfirmation('\nAre you sure you want to proceed?')
    if (!confirmed) {
      log.info('Aborted. No changes were made.')
      process.exit(0)
    }
  }

  log.info(`\n${'='.repeat(80)}`)
  log.info('Processing rows...')
  log.info(`${'='.repeat(80)}`)

  const startTime = new Date().toISOString()
  const { ok, reassigned, errors } = await processRows(qx, rows, dryRun)
  const endTime = new Date().toISOString()

  const summary: ProcessSummary = { ok, reassigned, errors, startTime, endTime, dryRun }

  log.info(`\n${'='.repeat(80)}`)
  log.info('Summary')
  log.info(`${'='.repeat(80)}`)
  log.info(`✓ OK:         ${summary.ok}`)
  log.info(`✓ Reassigned: ${summary.reassigned}`)
  if (summary.errors > 0) {
    log.warn(`✗ Errors:     ${summary.errors}`)
  }
  if (dryRun) {
    log.info('\n[DRY RUN] No changes were made.')
  }
  log.info(`Duration: ${summary.startTime} → ${summary.endTime}`)

  process.exit(summary.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  log.error('Unexpected error:', err)
  process.exit(1)
})
