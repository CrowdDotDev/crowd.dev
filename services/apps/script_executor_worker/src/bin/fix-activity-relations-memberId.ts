import { moveActivityRelationsWithIdentityToAnotherMember } from '@crowd/data-access-layer'
import { IDbActivityRelation } from '@crowd/data-access-layer/src/activityRelations/types'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

import { chunkArray } from '../utils/common'

const log = getServiceChildLogger('fix-activity-relations-memberId-script')

async function initPostgresClient(): Promise<QueryExecutor> {
  log.info('Initializing Postgres connection...')

  const dbConnection = await getDbConnection(WRITE_DB_CONFIG())
  const queryExecutor = pgpQx(dbConnection)

  log.info('Postgres connection established')
  return queryExecutor
}

async function findMembersWithWrongActivityRelations(
  qx: QueryExecutor,
  batchSize: number,
): Promise<Partial<IDbActivityRelation>[]> {
  const records = await qx.select(
    `
      SELECT ar."memberId", ar."username", ar."platform"
      FROM "activityRelations" ar
      WHERE EXISTS (
          SELECT 1
          FROM "memberIdentities" mi
          WHERE mi.platform = ar.platform
          AND mi.value = ar.username
          AND mi.type = 'username'
          AND mi.verified = true
          AND ar."memberId" != mi."memberId"
      )
      LIMIT $(batchSize);
      `,
    { batchSize },
  )

  // Deduplicate by (memberId, username, platform)
  const seen = new Set<string>()
  const uniqueRecords: Partial<IDbActivityRelation>[] = []

  for (const record of records) {
    const key = `${record.memberId}:${record.username}:${record.platform}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueRecords.push(record)
    }
  }

  return uniqueRecords
}

async function findMemberIdByUsernameAndPlatform(
  qx: QueryExecutor,
  username: string,
  platform: string,
): Promise<string> {
  const result = await qx.selectOneOrNone(
    `
    SELECT "memberId"
    FROM "memberIdentities"
    WHERE value = $(username)
    AND platform = $(platform)
    AND verified = TRUE
    AND type = 'username';
  `,
    { username, platform },
  )

  if (!result) {
    throw new Error(`No verified member found!`)
  }

  return result.memberId
}

async function moveActivityRelations(
  qx: QueryExecutor,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
): Promise<void> {
  await moveActivityRelationsWithIdentityToAnotherMember(qx, fromId, toId, username, platform)
}

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, val] = arg.split('=')
      return [key.replace(/^--/, ''), val ?? true]
    }),
  )

  const batchSize = Number(args['batch-size'] ?? 500)
  const testRun = Boolean(args['test-run'])

  log.info('Running script with args', { batchSize, testRun })

  const qx = await initPostgresClient()

  let records: Partial<IDbActivityRelation>[] = []

  records = await findMembersWithWrongActivityRelations(qx, batchSize)

  while (records.length > 0) {
    for (const chunk of chunkArray(records, 50)) {
      if (testRun) log.info('Processing chunk', chunk)

      const tasks = chunk.map(async (record) => {
        const correctMemberId = await findMemberIdByUsernameAndPlatform(
          qx,
          record.username,
          record.platform,
        )

        if (testRun) {
          log.info('Moving activity relations!', {
            fromId: record.memberId,
            toId: correctMemberId,
            username: record.username,
            platform: record.platform,
          })
        }

        await moveActivityRelations(
          qx,
          record.memberId,
          correctMemberId,
          record.username,
          record.platform,
        )
      })

      await Promise.all(tasks)
    }

    records = await findMembersWithWrongActivityRelations(qx, batchSize)

    if (testRun) {
      break
    }
  }
}

main().catch((error) => {
  log.error('Unexpected error:', error)
  process.exit(1)
})
