import { moveActivityRelationsWithIdentityToAnotherMember } from '@crowd/data-access-layer'
import {
  READ_DB_CONFIG,
  WRITE_DB_CONFIG,
  getDbConnection,
} from '@crowd/data-access-layer/src/database'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { getServiceChildLogger } from '@crowd/logging'

import { chunkArray } from '../utils/common'

const log = getServiceChildLogger('fix-activity-relations-memberId-script')

interface IPostgresClient {
  reader: QueryExecutor
  writer: QueryExecutor
}

interface IMemberIdentity {
  id: string
  memberId: string
  username: string
  platform: string
}

async function initPostgresClient(): Promise<IPostgresClient> {
  const reader = await getDbConnection(READ_DB_CONFIG())
  const writer = await getDbConnection(WRITE_DB_CONFIG())
  return {
    reader: pgpQx(reader),
    writer: pgpQx(writer),
  }
}

/**
 * Get the total number of member verified identities.
 */
async function getTotalMemberVerifiedIdentities(qx: QueryExecutor): Promise<number> {
  const result = await qx.selectOne(
    `
    SELECT COUNT(*) FROM "memberIdentities" WHERE type = 'username' AND verified = true;
    `,
  )

  return Number(result?.count ?? 0)
}

/**
 * Get batch of member identities using cursor-based pagination.
 * Uses primary key index - very fast.
 */
async function getMemberIdentitiesBatch(
  qx: QueryExecutor,
  lastId: string | null,
  batchSize: number,
): Promise<IMemberIdentity[]> {
  return qx.select(
    `
    SELECT id, "memberId", value as username, platform
    FROM "memberIdentities"
    WHERE type = 'username'
      AND verified = true
      AND id > $(lastId)
    ORDER BY id
    LIMIT $(batchSize);
    `,
    { lastId: lastId || '00000000-0000-0000-0000-000000000000', batchSize },
  )
}

/**
 * Get the wrong memberId for this identity (to pass to moveActivityRelations).
 * Uses ix_activityrelations_platform_username_memberid index - very fast.
 */
async function findIncorrectActivityRelationMemberId(
  qx: QueryExecutor,
  platform: string,
  username: string,
  correctMemberId: string,
): Promise<string | null> {
  const result = await qx.selectOneOrNone(
    `
    SELECT "memberId"
    FROM "activityRelations"
    WHERE platform = $(platform)
      AND username = $(username)
      AND "memberId" != $(correctMemberId)
    LIMIT 1;
    `,
    { platform, username, correctMemberId },
  )
  return result?.memberId || null
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

  const batchSize = Number(args['batch-size'] ?? 5000)
  const testRun = Boolean(args['test-run'])
  let lastId: string | null = (args['start-id'] as string | null) ?? null

  log.info('Running script with args', { batchSize, testRun, lastId })

  const { reader: qxReader, writer: qxWriter } = await initPostgresClient()

  let totalProcessed = 0

  const totalMemberVerifiedIdentities = await getTotalMemberVerifiedIdentities(qxReader)

  let identities = await getMemberIdentitiesBatch(qxReader, lastId, batchSize)

  while (identities.length > 0) {
    for (const chunk of chunkArray(identities, 50)) {
      const tasks = chunk.map(async (identity) => {
        let wrongMemberId = await findIncorrectActivityRelationMemberId(
          qxReader,
          identity.platform,
          identity.username,
          identity.memberId,
        )

        // Loop until all wrong memberIds are fixed for this identity
        while (wrongMemberId) {
          if (testRun) {
            log.info('Moving activity relations', {
              fromId: wrongMemberId,
              toId: identity.memberId,
              username: identity.username,
              platform: identity.platform,
            })
          } else {
            await moveActivityRelations(
              qxWriter,
              wrongMemberId,
              identity.memberId,
              identity.username,
              identity.platform,
            )
          }

          // Check again - are there more wrong memberIds for this identity?
          wrongMemberId = await findIncorrectActivityRelationMemberId(
            qxReader,
            identity.platform,
            identity.username,
            identity.memberId,
          )
        }
      })

      await Promise.all(tasks)
    }

    totalProcessed += identities.length
    lastId = identities[identities.length - 1].id

    log.info(`Progress`, {
      progress: ((totalProcessed / totalMemberVerifiedIdentities) * 100).toFixed(2) + '%',
      lastId,
    })

    if (testRun) {
      log.info('Test run - stopping after first batch')
      break
    }

    identities = await getMemberIdentitiesBatch(qxReader, lastId, batchSize)
  }

  log.info('Script completed', { totalProcessed })
}

main().catch((error) => {
  log.error('Unexpected error:', error)
  process.exit(1)
})
