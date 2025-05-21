import { TINYBIRD_CONFIG } from '../conf'

const TINYBIRD_API_URL = 'https://api.us-west-2.aws.tinybird.co/v0/datasources'
const DATA_SOURCES = ['activityRelations', 'members', 'memberIdentities']
const TOKEN = TINYBIRD_CONFIG().token

/**
 * This uses "Delete Data Selectively" from Tinybird:
 * https://www.tinybird.co/docs/classic/get-data-in/data-operations/replace-and-delete-data#delete-data-selectively
 *
 * It deletes member data for GDPR compliance from the `members` and `activityRelations` datasources.
 * All datasources created from pipes based on these tables will reflect the deletions within one hour,
 * as the relevant copy pipes are scheduled to run hourly.
 */

const args = process.argv.slice(2)

if (args.length !== 1) {
  console.error('Usage: deleteMemberTinybird.ts <memberId>')
  process.exit(1)
}

const memberId = args[0]

async function deleteFromDataSource(tableName: string, memberId: string) {
  const url = `${TINYBIRD_API_URL}/${tableName}/delete`
  const body = new URLSearchParams({
    delete_condition: `memberId = '${memberId}'`,
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
  if (!TOKEN) {
    console.error('TINYBIRD_TOKEN environment variable not set!')
    process.exit(1)
  }

  for (const table of DATA_SOURCES) {
    try {
      await deleteFromDataSource(table, memberId)
    } catch (err) {
      console.error(err)
    }
  }
}

main()
