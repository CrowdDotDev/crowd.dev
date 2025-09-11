import * as readline from 'readline'

import { DbStore, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceChildLogger } from '@crowd/logging'

import { DB_CONFIG } from '../conf'

/**
 * Member Data Soft Deletion Script (QuestDB Analytics)
 *
 * This script performs soft deletion of member data in QuestDB for GDPR compliance
 * and data deletion requests. Unlike hard deletion scripts, this marks records as
 * deleted and clears sensitive references while preserving analytical structure.
 *
 * WHAT THIS SCRIPT DOES:
 * 1. Shows a detailed summary of all data to be soft-deleted/modified in QuestDB
 * 2. Requests user confirmation before proceeding
 * 3. Performs the following operations:
 *    - Sets deletedAt timestamp on activities records matching memberId
 *    - Clears objectMemberId and objectMemberUsername references in activities
 *    - Updates updatedAt timestamp to reflect the changes
 *
 * SOFT DELETION APPROACH:
 * - Records are not physically deleted, but marked with deletedAt timestamp
 * - This preserves referential integrity and analytical structure
 * - Queries with proper deletedAt filtering will exclude these records
 * - Allows for potential data recovery if needed
 *
 * TABLES AFFECTED:
 * - activities: Records where memberId matches are marked as deleted
 * - activities: Records where objectMemberId matches have references cleared
 *
 * QUESTDB CONSIDERATIONS:
 * - QuestDB uses update statements to modify existing records
 * - deletedAt is set to current timestamp (NOW())
 * - updatedAt is also updated to reflect the modification time
 *
 * USAGE:
 *   npm run script erasure-members-data-questdb <memberId>
 *
 * REQUIREMENTS:
 * - QuestDB database connection configured in DB_CONFIG
 * - Proper permissions to UPDATE activities table
 *
 * SAFETY FEATURES:
 * - Shows detailed summary with record counts before proceeding
 * - Requires explicit user confirmation (Y/n)
 * - Comprehensive error handling and logging
 * - Preserves data for potential recovery
 *
 * RELATIONSHIP TO OTHER SCRIPTS:
 * - Complements erase-member.ts (PostgreSQL hard deletion)
 * - Complements erase-members-data-tinybird.ts (Tinybird hard deletion)
 * - Should be run before hard deletion scripts if data recovery might be needed
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
 * Generates a comprehensive summary of all data that will be soft-deleted or modified
 * in QuestDB for the specified member. Queries the activities table to provide exact counts.
 *
 * @param store - Database store instance
 * @param memberId - The member ID to analyze
 * @returns Formatted summary string showing what will be affected
 */
async function getQuestDbDeletionSummary(store: DbStore, memberId: string): Promise<string> {
  let summary = `\n=== QUESTDB SOFT DELETION SUMMARY FOR MEMBER ${memberId} ===\n`

  // Count activities that will be marked as deleted (where memberId matches)
  const activitiesToDelete = await store
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "memberId" = $(memberId) AND "deletedAt" IS NULL`,
      {
        memberId,
      },
    )
  if (parseInt(activitiesToDelete.count) > 0) {
    summary += `- ${activitiesToDelete.count} activities will be marked as deleted (deletedAt set)\n`
  }

  // Count activities that will have object member references cleared
  const activitiesToClear = await store
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "objectMemberId" = $(memberId) AND "deletedAt" IS NULL`,
      {
        memberId,
      },
    )
  if (parseInt(activitiesToClear.count) > 0) {
    summary += `- ${activitiesToClear.count} activities will have objectMemberId/objectMemberUsername cleared\n`
  }

  // Check for overlap (records that will have both operations applied)
  const overlappingRecords = await store
    .connection()
    .one(
      `SELECT count(*) as count FROM activities WHERE "memberId" = $(memberId) AND "objectMemberId" = $(memberId) AND "deletedAt" IS NULL`,
      { memberId },
    )
  if (parseInt(overlappingRecords.count) > 0) {
    summary += `- ${overlappingRecords.count} activities will have both operations applied (marked deleted AND references cleared)\n`
  }

  summary += `\n`
  return summary
}

/**
 * Performs the actual soft deletion of member data in QuestDB activities table.
 * This function handles both marking records as deleted and clearing object member references.
 *
 * OPERATIONS PERFORMED:
 * 1. Mark activities as deleted where memberId matches
 * 2. Clear objectMemberId and objectMemberUsername where they reference the member
 *
 * @param store - Database store instance (should be within a transaction)
 * @param memberId - The member ID to soft delete
 */
async function softDeleteMemberFromQuestDb(store: DbStore, memberId: string): Promise<void> {
  // Mark activities as deleted where memberId matches
  let result = await store.connection().result(
    `
    UPDATE activities SET 
      "deletedAt" = NOW(),
      "updatedAt" = NOW()
    WHERE "memberId" = $(memberId) AND "deletedAt" IS NULL
    `,
    { memberId },
  )

  if (result.rowCount > 0) {
    log.info(`Marked ${result.rowCount} activities as deleted for memberId ${memberId}`)
  }

  // Clear objectMemberId and objectMemberUsername references
  result = await store.connection().result(
    `
    UPDATE activities SET 
      "objectMemberId" = NULL,
      "objectMemberUsername" = NULL,
      "updatedAt" = NOW()
    WHERE "objectMemberId" = $(memberId) AND "deletedAt" IS NULL
    `,
    { memberId },
  )

  if (result.rowCount > 0) {
    log.info(
      `Cleared objectMember references in ${result.rowCount} activities for memberId ${memberId}`,
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
  const dbConnection = await getDbConnection(DB_CONFIG())
  const store = new DbStore(log, dbConnection)

  log.info(`Soft deleting member data from QuestDB for member ID: ${memberId}`)

  try {
    // Show deletion summary and get confirmation
    const summary = await getQuestDbDeletionSummary(store, memberId)
    console.log(summary)

    const proceed = await promptConfirmation(
      'Do you want to proceed with the QuestDB soft deletion?',
    )

    if (!proceed) {
      log.info('Soft deletion cancelled by user')
      process.exit(0)
    }

    await store.transactionally(async (t) => {
      // Perform soft deletion operations
      await softDeleteMemberFromQuestDb(t, memberId)
    })

    log.info('QuestDB soft deletion completed successfully')
  } catch (err) {
    log.error(err, { memberId }, 'Failed to soft delete member from QuestDB!')
  }

  process.exit(0)
})
