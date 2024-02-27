import { DbStore } from '@crowd/database'
import { MergeActionState } from '@crowd/types'
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

export async function moveIdentityActivitiesToNewMember(
  db: DbStore,
  tenantId: string,
  fromId: string,
  toId: string,
  username: string,
  platform: string,
) {
  return db.connection().query(
    `
        UPDATE activities
        SET "memberId" = $1
        WHERE "memberId" = $2
          AND "tenantId" = $3
          AND username = $4
          AND platform = $5;
      `,
    [toId, fromId, tenantId, username, platform],
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

export async function markMemberAsManuallyCreated(db: DbStore, memberId: string): Promise<void> {
  return db.connection().query(
    `
      UPDATE members set "manuallyCreated" = true
      WHERE "id" = $1
    `,
    [memberId],
  )
}
