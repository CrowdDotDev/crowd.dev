import { svc } from '../main'

export async function deleteMember(memberId: string): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM "memberSegments"
      WHERE "memberId" = $1
    `,
    [memberId],
  )
  await svc.postgres.writer.connection().query(
    `
      DELETE FROM members
      WHERE id = $1
    `,
    [memberId],
  )
}

export async function moveActivitiesBetweenMembers(
  primaryId: string,
  secondaryId: string,
  tenantId: string,
): Promise<void> {
  await svc.postgres.writer.connection().query(
    `
      UPDATE activities
      SET "memberId" = $1
      WHERE "memberId" = $2
        AND "tenantId" = $3;
    `,
    [primaryId, secondaryId, tenantId],
  )
}
