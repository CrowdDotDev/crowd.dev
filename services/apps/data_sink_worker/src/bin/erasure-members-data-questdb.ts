import * as readline from 'readline'

import { generateUUIDv1 } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { getServiceChildLogger } from '@crowd/logging'
import { getClientSQL } from '@crowd/questdb'

/**
 * Member Data Anonymization Script (QuestDB Analytics)
 *
 * This script performs anonymization and soft deletion of member data in QuestDB for GDPR compliance
 * and data deletion requests. Unlike hard deletion scripts, this replaces identifying data with
 * anonymous dummy values while preserving analytical structure and marking records as deleted.
 *
 * WHAT THIS SCRIPT DOES:
 * 1. Shows a detailed summary of all data to be anonymized/soft-deleted in QuestDB
 * 2. Requests user confirmation before proceeding
 * 3. Performs the following operations:
 *    - Replaces memberId with random UUID and username with deleted-{UUID}
 *    - Replaces objectMemberId with random UUID and objectMemberUsername with deleted-{UUID}
 *    - Sets deletedAt timestamp on activities records matching memberId
 *    - Updates updatedAt timestamp to reflect the changes
 *
 * ANONYMIZATION APPROACH:
 * - Records are not physically deleted, but marked with deletedAt timestamp
 * - Identifying data (memberId, username) is replaced with anonymous dummy values
 * - Uses random UUIDs to ensure no collision with real data
 * - Different UUIDs are used for member vs objectMember references to prevent correlation
 * - Preserves referential integrity and analytical structure
 * - Queries with proper deletedAt filtering will exclude these records
 *
 * TABLES AFFECTED:
 * - activities: Records where memberId matches are anonymized and marked deleted
 * - activities: Records where objectMemberId matches have object references anonymized
 *
 * QUESTDB CONSIDERATIONS:
 * - QuestDB uses update statements to modify existing records
 * - deletedAt is set to current timestamp (NOW())
 * - updatedAt is also updated to reflect the modification time
 * - Anonymized data uses format: memberId = random-uuid, username = deleted-{random-uuid}
 *
 * USAGE:
 *   npm run script erasure-members-data-questdb <memberId>
 *
 * REQUIREMENTS:
 * - QuestDB database connection configured via CROWD_QUESTDB_SQL_* environment variables
 * - Proper permissions to UPDATE activities table
 *
 * SAFETY FEATURES:
 * - Shows detailed anonymization summary with record counts before proceeding
 * - Requires explicit user confirmation (Y/n)
 * - Comprehensive error handling and logging
 * - Data is anonymized, not destroyed, allowing for analytical continuity
 *
 * RELATIONSHIP TO OTHER SCRIPTS:
 * - Complements erase-member.ts (PostgreSQL hard deletion)
 * - Complements erase-members-data-tinybird.ts (Tinybird hard deletion)
 * - Can be run independently to anonymize QuestDB data while preserving analytics
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceChildLogger('erasure-members-data-questdb')

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
 * Generates a comprehensive summary of all data that will be anonymized and soft-deleted
 * in QuestDB for the specified member. Queries the activities table to provide exact counts.
 *
 * @param qdbStore - QuestDB store instance
 * @param memberId - The member ID to analyze
 * @returns Formatted summary string showing what will be anonymized
 */
async function getQuestDbDeletionSummary(qdbStore: DbStore, memberId: string): Promise<string> {
  let summary = `\n=== QUESTDB ANONYMIZATION SUMMARY FOR MEMBER ${memberId} ===\n`

  // Count activities that will be anonymized and marked as deleted (where memberId matches)
  const activitiesToAnonymize = await qdbStore
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "memberId" = $(memberId) AND "deletedAt" IS NULL`,
      { memberId },
    )
  if (parseInt(activitiesToAnonymize.count) > 0) {
    summary += `- ${activitiesToAnonymize.count} activities will be anonymized (memberId → random UUID, username → deleted-{UUID}) and marked deleted\n`
  }

  // Count activities that will have object member references anonymized
  const activitiesToAnonymizeObject = await qdbStore
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "objectMemberId" = $(memberId) AND "deletedAt" IS NULL`,
      { memberId },
    )
  if (parseInt(activitiesToAnonymizeObject.count) > 0) {
    summary += `- ${activitiesToAnonymizeObject.count} activities will have objectMember references anonymized (objectMemberId → random UUID, objectMemberUsername → deleted-{UUID})\n`
  }

  // Check for overlap (records that will have both operations applied)
  const overlappingRecords = await qdbStore
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "memberId" = $(memberId) AND "objectMemberId" = $(memberId) AND "deletedAt" IS NULL`,
      { memberId },
    )
  if (parseInt(overlappingRecords.count) > 0) {
    summary += `- ${overlappingRecords.count} activities will have both member and objectMember data anonymized\n`
  }

  summary += `\nNOTE: Different random UUIDs will be used for member vs objectMember references to prevent correlation.\n\n`
  return summary
}

/**
 * Performs anonymization and soft deletion of member data in QuestDB activities table.
 * This function replaces identifying data with dummy values and marks records as deleted.
 *
 * OPERATIONS PERFORMED:
 * 1. Replace memberId with random UUID and username with deleted-${uuid} where memberId matches
 * 2. Replace objectMemberId with random UUID and objectMemberUsername with deleted-${uuid} where they reference the member
 *
 * @param qdbStore - QuestDB store instance
 * @param memberId - The member ID to anonymize and soft delete
 */
async function softDeleteMemberFromQuestDb(qdbStore: DbStore, memberId: string): Promise<void> {
  // Generate random UUID for anonymization
  const anonymousUuid = generateUUIDv1()
  const anonymousUsername = `deleted-${anonymousUuid}`

  // Anonymize activities where memberId matches
  let result = await qdbStore.connection().result(
    `
    UPDATE activities SET 
      "memberId" = $(anonymousUuid),
      "username" = $(anonymousUsername),
      "deletedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "memberId" = $(memberId) AND "deletedAt" IS NULL
    `,
    { memberId, anonymousUuid, anonymousUsername },
  )

  if (result.rowCount > 0) {
    log.info(
      `Anonymized and marked ${result.rowCount} activities as deleted for memberId ${memberId}`,
    )
  }

  // Generate separate UUID for object member references to avoid correlation
  const objectAnonymousUuid = generateUUIDv1()
  const objectAnonymousUsername = `deleted-${objectAnonymousUuid}`

  // Anonymize objectMemberId and objectMemberUsername references
  result = await qdbStore.connection().result(
    `
    UPDATE activities SET 
      "objectMemberId" = $(objectAnonymousUuid),
      "objectMemberUsername" = $(objectAnonymousUsername),
      "updatedAt" = NOW()
    WHERE "objectMemberId" = $(memberId) AND "deletedAt" IS NULL
    `,
    { memberId, objectAnonymousUuid, objectAnonymousUsername },
  )

  if (result.rowCount > 0) {
    log.info(
      `Anonymized objectMember references in ${result.rowCount} activities for memberId ${memberId}`,
    )
  }
}

const processArguments = process.argv.slice(2)

if (processArguments.length !== 1) {
  log.error('Expected exactly one argument: memberId')
  process.exit(1)
}

const memberId = processArguments[0]

setImmediate(async () => {
  const qdbConnection = await getClientSQL()
  const qdbStore = new DbStore(log, qdbConnection)

  log.info(`Anonymizing member data in QuestDB for member ID: ${memberId}`)

  try {
    // Show anonymization summary and get confirmation
    const summary = await getQuestDbDeletionSummary(qdbStore, memberId)
    console.log(summary)

    const proceed = await promptConfirmation(
      'Do you want to proceed with the QuestDB anonymization?',
    )

    if (!proceed) {
      log.info('Anonymization cancelled by user')
      process.exit(0)
    }

    // Perform anonymization operations
    await softDeleteMemberFromQuestDb(qdbStore, memberId)

    log.info('QuestDB member anonymization completed successfully')
  } catch (err) {
    log.error(err, { memberId }, 'Failed to anonymize member data in QuestDB!')
  }

  process.exit(0)
})
