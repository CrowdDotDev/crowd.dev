import { IMemberIdentity } from '@crowd/types'
import { QueryExecutor } from '../queryExecutor'

export async function fetchMemberIdentities(
  qx: QueryExecutor,
  memberId: string,
): Promise<IMemberIdentity[]> {
  return qx.select(
    `
      SELECT id, platform, "sourceId", type, value, verified
      FROM "memberIdentities"
      WHERE "memberId" = $(memberId)
    `,
    {
      memberId,
    },
  )
}

export async function fetchManyMemberIdentities(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<{ memberId: string; identities: IMemberIdentity[] }[]> {
  return qx.select(
    `
      SELECT
          mi."memberId",
          JSONB_AGG(mi ORDER BY mi."createdAt") AS "identities"
      FROM "memberIdentities" mi
      WHERE mi."memberId" IN ($(memberIds:csv))
      GROUP BY mi."memberId"
    `,
    {
      memberIds,
    },
  )
}

export async function createMemberIdentity(
  qx: QueryExecutor,
  memberId: string,
  data: Partial<IMemberIdentity>,
): Promise<void> {
  return qx.select(
    `
        INSERT INTO "memberIdentities"("memberId", platform, type, value, verified)
        VALUES($(memberId), $(platform), $(type), $(value), $(verified))
        ON CONFLICT DO NOTHING;
    `,
    {
      memberId,
      platform: data.platform,
      type: data.type,
      value: data.value,
      verified: data.verified || false,
    },
  )
}
export async function updateMemberIdentity(
  qx: QueryExecutor,
  memberId: string,
  id: string,
  data: Partial<IMemberIdentity>,
): Promise<void> {
  return qx.select(
    `
          UPDATE "memberIdentities"
          SET
              platform = $(platform),
              type = $(type),
              value = $(value),
              verified = $(verified)
          WHERE "memberId" = $(memberId) AND "id" = $(id);
      `,
    {
      memberId,
      id,
      platform: data.platform,
      type: data.type,
      value: data.value,
      verified: data.verified || false,
    },
  )
}

export async function deleteMemberIdentity(
  qx: QueryExecutor,
  memberId: string,
  id: string,
): Promise<void> {
  return qx.select(
    `
        DELETE FROM "memberIdentities"
        WHERE "memberId" = $(memberId) AND "id" = $(id);
    `,
    {
      memberId,
      id,
    },
  )
}
