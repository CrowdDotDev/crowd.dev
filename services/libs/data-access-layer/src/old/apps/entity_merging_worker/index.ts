import { DbConnOrTx, DbStore } from '@crowd/database'
import { IQueue } from '@crowd/queue'
import { IActivityIdentity, IMemberIdentity, MergeActionState, MergeActionStep } from '@crowd/types'

import { getMemberActivityTimestampRanges, updateActivities } from '../../../activities/update'
import { formatQuery, pgpQx } from '../../../queryExecutor'
import { IDbActivityCreateData } from '../data_sink_worker/repo/activity.data'

import { ISegmentIds } from './types'

export async function deleteMemberSegments(db: DbStore, memberId: string) {
  return db.connection().query(
    `
      DELETE FROM "memberSegments"
      WHERE "memberId" = $1
    `,
    [memberId],
  )
}

export async function cleanupMember(db: DbStore, memberId: string) {
  return db.connection().query(
    `
      DELETE FROM members
      WHERE id = $1
    `,
    [memberId],
  )
}

export async function findMemberById(db: DbStore, primaryId: string) {
  return db.connection().oneOrNone(
    `
      SELECT id
      FROM members
      WHERE id = $1
    `,
    [primaryId],
  )
}

export async function updateMergeActionState(
  db: DbStore,
  primaryId: string,
  secondaryId: string,
  data: { step?: MergeActionStep; state?: MergeActionState },
) {
  const setClauses = []
  const replacements = [primaryId, secondaryId]

  if (data.step) {
    setClauses.push(`step = $${replacements.length + 1}`)
    replacements.push(data.step)
  }

  if (data.state) {
    setClauses.push(`state = $${replacements.length + 1}`)
    replacements.push(data.state)
  }

  return db.connection().query(
    `
      UPDATE "mergeActions"
      SET ${setClauses.join(', ')}
      WHERE "primaryId" = $1
        AND "secondaryId" = $2
    `,
    replacements,
  )
}

export async function getIdentitiesWithActivity(
  db: DbStore,
  memberId: string,
  identities: IMemberIdentity[],
): Promise<IActivityIdentity[]> {
  if (identities.length === 0) {
    return []
  }
  const replacements = [memberId]

  let query = `select distinct username, platform from activities a
               where a."deletedAt" is null and a."memberId" = $1 `

  let index = 3
  const identityFilters = []

  for (let i = 0; i < identities.length; i++) {
    identityFilters.push(`(a.platform = $${index} and a.username = $${index + 1})`)
    replacements[index - 1] = identities[i].platform
    replacements[index] = identities[i].value
    index += 2
  }

  query += ` and (${identityFilters.join(' or ')})`

  return db.connection().any(query, replacements)
}

export async function moveIdentityActivitiesToNewMember(
  db: DbConnOrTx,
  pgDb: DbConnOrTx,
  queueClient: IQueue,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
) {
  const { minTimestamp, maxTimestamp } = await getMemberActivityTimestampRanges(db, fromId)
  await updateActivities(
    db,
    pgpQx(pgDb),
    queueClient,
    async (activity: IDbActivityCreateData) => ({ ...activity, memberId: toId }),
    formatQuery(
      `
        "memberId" = $(fromId)
        and "username" = $(username)
        and "platform" = $(platform)
        ${minTimestamp ? 'AND "timestamp" >= $(minTimestamp)' : ''}
        ${maxTimestamp ? 'AND "timestamp" <= $(maxTimestamp)' : ''}
      `,
      {
        fromId,
        username,
        platform,
        ...(minTimestamp && { minTimestamp }),
        ...(maxTimestamp && { maxTimestamp }),
      },
    ),
    {
      memberId: fromId,
    },
  )
}

export async function findMemberSegments(db: DbStore, memberId: string): Promise<ISegmentIds> {
  const result = await db.connection().one(
    `
      SELECT array_agg(distinct "segmentId") as "segmentIds"
      FROM activities
      WHERE "memberId" = $1
    `,
    [memberId],
  )
  return result as ISegmentIds
}

export async function findOrganizationSegments(
  db: DbStore,
  organizationId: string,
): Promise<ISegmentIds> {
  const result = await db.connection().one(
    `
      SELECT array_agg(distinct "segmentId") as "segmentIds"
      FROM activities
      WHERE "organizationId" = $1
    `,
    [organizationId],
  )
  return result as ISegmentIds
}

export async function markMemberAsManuallyCreated(db: DbStore, memberId: string): Promise<void> {
  return db.connection().query(
    `
      UPDATE members set "manuallyCreated" = true
      WHERE "id" = $1
    `,
    [memberId],
  )
}

export async function markOrganizationAsManuallyCreated(
  db: DbStore,
  organizationId: string,
): Promise<void> {
  return db.connection().query(
    `
      UPDATE organizations set "manuallyCreated" = true
      WHERE "id" = $1
    `,
    [organizationId],
  )
}
