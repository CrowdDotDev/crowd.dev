import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

const DEFAULT_COLUMNS: (keyof IMemberIdentity)[] = [
  'id',
  'platform',
  'sourceId',
  'type',
  'value',
  'verified',
]

export async function fetchMemberIdentities(
  qx: QueryExecutor,
  memberId: string,
  filter: { verified?: boolean } = {},
  columns: (keyof IMemberIdentity)[] = DEFAULT_COLUMNS,
): Promise<IMemberIdentity[]> {
  const where: string[] = ['"memberId" = $(memberId)']

  if (filter.verified) {
    where.push('verified = $(verified)')
  }

  const selectedColumns = columns.map((c) => `"${c}"`).join(', ')

  return qx.select(
    `
      SELECT ${selectedColumns}
      FROM "memberIdentities"
      WHERE ${where.join(' AND ')}
    `,
    {
      memberId,
      verified: filter.verified,
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

export async function checkIdentityExistance(
  qx: QueryExecutor,
  value: string,
  platform: string,
): Promise<IMemberIdentity[]> {
  return await qx.select(
    `
        SELECT id, "memberId"
        FROM "memberIdentities"
        WHERE "value" = $(value)
        AND "platform" = $(platform);
    `,
    {
      value,
      platform,
    },
  )
}

export async function createMemberIdentity(
  qx: QueryExecutor,
  tenantId: string,
  memberId: string,
  data: Partial<IMemberIdentity>,
): Promise<void> {
  return qx.result(
    `
        INSERT INTO "memberIdentities"("tenantId", "memberId", platform, type, value, verified)
        VALUES($(tenantId), $(memberId), $(platform), $(type), $(value), $(verified))
        ON CONFLICT DO NOTHING;
    `,
    {
      tenantId,
      memberId,
      platform: data.platform,
      type: data.type,
      value: data.value,
      verified: data.verified || false,
    },
  )
}

export async function findMemberIdentityById(
  qx: QueryExecutor,
  memberId: string,
  id: string,
): Promise<IMemberIdentity> {
  const res = await qx.select(
    `
        SELECT id, platform, "sourceId", type, value, verified
        FROM "memberIdentities"
        WHERE "id" = $(id) AND "memberId" = $(memberId);
    `,
    {
      id,
      memberId,
    },
  )
  return res.length > 0 ? res[0] : null
}

export async function findMemberIdentitiesByValue(
  qx: QueryExecutor,
  memberId: string,
  value: string,
  filter: { type?: MemberIdentityType },
): Promise<IMemberIdentity[]> {
  return qx.select(
    `
        SELECT id, platform, "sourceId", type, value, verified
        FROM "memberIdentities"
        WHERE value = $(value) AND "memberId" = $(memberId)
        ${filter.type ? 'AND type = $(type)' : ''}
    `,
    { value, memberId, type: filter.type },
  )
}

export async function updateMemberIdentity(
  qx: QueryExecutor,
  memberId: string,
  id: string,
  data: Partial<IMemberIdentity>,
): Promise<void> {
  return qx.result(
    `
          UPDATE "memberIdentities"
          SET
              platform = $(platform),
              type = $(type),
              value = $(value),
              verified = $(verified),
              "sourceId" = $(sourceId),
              "integrationId" = $(integrationId)
          WHERE "memberId" = $(memberId) AND "id" = $(id);
      `,
    {
      memberId,
      id,
      platform: data.platform,
      type: data.type,
      value: data.value,
      verified: data.verified || false,
      sourceId: data.sourceId || null,
      integrationId: data.integrationId || null,
    },
  )
}

export async function deleteMemberIdentity(
  qx: QueryExecutor,
  memberId: string,
  id: string,
): Promise<void> {
  return qx.result(
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

export async function lfidToMemberId(qx: QueryExecutor, lfid: string): Promise<string | null> {
  const result = await qx.selectOneOrNone(
    `
      select "memberId"
      from "memberIdentities"
      where "platform" = 'lfid' and "value" = $(lfid)
      and verified = true limit 1;
    `,
    {
      lfid,
    },
  )

  return result?.memberId ?? null
}
