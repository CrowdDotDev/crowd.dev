import { DbStore } from '@crowd/database'

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
