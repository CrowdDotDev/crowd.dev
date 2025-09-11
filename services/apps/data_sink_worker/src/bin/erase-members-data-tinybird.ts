import * as readline from 'readline'

const TINYBIRD_API_URL = 'https://api.us-west-2.aws.tinybird.co/v0/datasources'
const DATA_SOURCES = ['activityRelations', 'members', 'maintainersInternal', 'memberIdentities']

/**
 * Member Data Erasure Script (Tinybird Analytics Platform)
 *
 * This script removes member data from Tinybird datasources for GDPR compliance
 * and data deletion requests. It complements the database deletion script by
 * cleaning up analytical data stored in Tinybird.
 *
 * WHAT THIS SCRIPT DOES:
 * 1. Shows a detailed summary of records to be deleted from each Tinybird datasource
 * 2. Requests user confirmation before proceeding
 * 3. Deletes data from Tinybird datasources in the correct order to respect dependencies
 * 4. Handles special cases like maintainersInternal which requires identityId-based deletion
 *
 * TINYBIRD INTEGRATION:
 * Uses "Delete Data Selectively" API from Tinybird:
 * https://www.tinybird.co/docs/classic/get-data-in/data-operations/replace-and-delete-data#delete-data-selectively
 *
 * DATASOURCES AFFECTED (in deletion order):
 * 1. activityRelations - Activity relationship records (deleted by memberId)
 * 2. members - Member profile data (deleted by memberId)
 * 3. maintainersInternal - Repository maintainer records (deleted by identityId from member's identities)
 * 4. memberIdentities - Member identity records (deleted by memberId)
 *
 * FOREIGN KEY HANDLING:
 * - maintainersInternal.identityId → memberIdentities.id
 *   Solution: Use subquery in delete condition - 'identityId IN (SELECT id FROM memberIdentities WHERE memberId = ?)'
 *
 * DOWNSTREAM EFFECTS:
 * All datasources created from pipes based on these tables will reflect the deletions
 * after the relevant copy pipes run (typically scheduled hourly).
 *
 * USAGE:
 *   npm run script erase-members-data-tinybird <memberId> <tinybirdToken>
 *
 * REQUIREMENTS:
 * - Tinybird token must be provided as command line argument
 * - Token must have delete permissions on the specified datasources
 *
 * SAFETY FEATURES:
 * - Shows detailed deletion summary with record counts before proceeding
 * - Requires explicit user confirmation (Y/n)
 * - Graceful error handling for API failures
 * - Special validation for maintainersInternal dependencies
 */

const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error('Usage: erase-members-data-tinybird.ts <memberId> <tinybirdToken>')
  process.exit(1)
}

const memberId = args[0]
const TOKEN = args[1]

/**
 * Prompts the user for Y/n confirmation via command line input
 */
async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (Y/n): `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer === '')
    })
  })
}

/**
 * Queries Tinybird to get the count of records matching a condition in a specific datasource
 *
 * @param tableName - The Tinybird datasource name
 * @param condition - SQL WHERE condition to count matching records
 * @returns Number of matching records, or 0 if query fails
 */
async function getRecordCount(tableName: string, condition: string): Promise<number> {
  const query = `SELECT count() as count FROM ${tableName} WHERE ${condition}`
  const url = `https://api.us-west-2.aws.tinybird.co/v0/sql`

  const params = new URLSearchParams({
    q: query,
  })

  const response = await fetch(`${url}?${params}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  })

  if (!response.ok) {
    console.warn(`Failed to get count for ${tableName}: ${response.statusText}`)
    return 0
  }

  const data = (await response.json()) as { data?: Array<{ count: number }> }
  return data.data?.[0]?.count || 0
}

/**
 * Generates a comprehensive summary of all data that will be deleted from Tinybird
 * datasources for the specified member. Queries each datasource to provide exact record counts.
 *
 * Handles special logic for maintainersInternal using a subquery to count records
 * by identityId from the member's identities.
 *
 * @param memberId - The member ID to analyze
 * @returns Formatted summary string showing what will be deleted from each datasource
 */
async function getTinybirdDeletionSummary(memberId: string): Promise<string> {
  let summary = `\n=== TINYBIRD DELETION SUMMARY FOR MEMBER ${memberId} ===\n`

  for (const table of DATA_SOURCES) {
    let condition: string

    if (table === 'maintainersInternal') {
      // Use subquery to count maintainersInternal records by identityId
      condition = `identityId IN (SELECT id FROM memberIdentities WHERE memberId = '${memberId}')`
    } else if (table === 'members') {
      // Members table uses 'id' as the primary key, not 'memberId'
      condition = `id = '${memberId}'`
    } else {
      condition = `memberId = '${memberId}'`
    }

    const count = await getRecordCount(table, condition)
    if (count > 0) {
      summary += `- ${count} records from ${table}\n`
    }
  }

  summary += `\n`
  return summary
}

/**
 * Deletes member data from a specific Tinybird datasource using the appropriate condition.
 *
 * For most datasources, deletes by memberId directly.
 * For maintainersInternal, uses a subquery to delete by identityId from the member's identities.
 *
 * @param tableName - The Tinybird datasource name
 * @param memberId - The member ID to delete data for
 */
async function deleteFromDataSource(tableName: string, memberId: string) {
  const url = `${TINYBIRD_API_URL}/${tableName}/delete`
  let deleteCondition: string

  if (tableName === 'maintainersInternal') {
    // Delete maintainersInternal using subquery to get identityIds from memberIdentities
    deleteCondition = `identityId IN (SELECT id FROM memberIdentities WHERE memberId = '${memberId}')`
  } else if (tableName === 'members') {
    // Members table uses 'id' as the primary key, not 'memberId'
    deleteCondition = `id = '${memberId}'`
  } else {
    deleteCondition = `memberId = '${memberId}'`
  }

  const body = new URLSearchParams({
    delete_condition: deleteCondition,
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const text = await response.text()
  if (!response.ok) {
    console.error(`Failed to delete from ${tableName}:`, text)
    throw new Error(`Delete failed for table ${tableName}`)
  }

  console.log(`Deleted from ${tableName}:`, text)
}

async function main() {
  // Show deletion summary and get confirmation
  const summary = await getTinybirdDeletionSummary(memberId)
  console.log(summary)

  const proceed = await promptConfirmation('Do you want to proceed with the Tinybird deletion?')

  if (!proceed) {
    console.log('Deletion cancelled by user')
    process.exit(0)
  }

  // Process in order to respect foreign key constraints - maintainersInternal before memberIdentities
  const orderedTables = ['activityRelations', 'members', 'maintainersInternal', 'memberIdentities']

  for (const table of orderedTables) {
    try {
      await deleteFromDataSource(table, memberId)
    } catch (err) {
      console.error(err)
    }
  }
}

main()
