import { DbStore } from '@crowd/database'
import { IActivityIdentity, IMemberIdentity, MergeActionState } from '@crowd/types'
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

export async function findMemberById(db: DbStore, primaryId: string, tenantId: string) {
  return db.connection().oneOrNone(
    `
      SELECT id
      FROM members
      WHERE id = $1
        AND "tenantId" = $2
    `,
    [primaryId, tenantId],
  )
}

export async function moveActivitiesToNewMember(
  db: DbStore,
  primaryId: string,
  secondaryId: string,
  tenantId: string,
) {
  await db.connection().query(
    `
      UPDATE activities
      SET "memberId" = $1
      WHERE "memberId" = $2
        AND "tenantId" = $3;
    `,
    [primaryId, secondaryId, tenantId],
  )
}

export async function updateMergeActionState(
  db: DbStore,
  primaryId: string,
  secondaryId: string,
  tenantId: string,
  state: MergeActionState,
) {
  return db.connection().query(
    `
            UPDATE "mergeActions"
            SET state = $4
            WHERE "tenantId" = $3
              AND "primaryId" = $1
              AND "secondaryId" = $2
              AND state != $4
        `,
    [primaryId, secondaryId, tenantId, state],
  )
}

export async function getIdentitiesWithActivity(
  db: DbStore,
  memberId: string,
  tenantId: string,
  identities: IMemberIdentity[],
): Promise<IActivityIdentity[]> {
  if (identities.length === 0) {
    return []
  }
  const replacements = [memberId, tenantId]

  let query = `select distinct username, platform from activities a
               where a."memberId" = $1 and a."tenantId" = $2 `

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
  db: DbStore,
  tenantId: string,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
  batchSize = 1000,
) {
  let rowsUpdated

  do {
    const result = await db.connection().query(
      `
          UPDATE activities
          SET "memberId" = $(toId)
          WHERE id in (
            select id from activities
            where "memberId" = $(fromId)
              and "tenantId" = $(tenantId)
              and "username" = $(username)
              and "platform" = $(platform)
              limit $(batchSize)
          )
          returning id
        `,
      {
        toId,
        fromId,
        tenantId,
        username,
        platform,
        batchSize,
      },
    )

    rowsUpdated = result.length
  } while (rowsUpdated === batchSize)
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
