import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { deleteMemberIdentities, moveToNewMember, updateVerifiedFlag } from '../member_identities'
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
        AND "deletedAt" is null
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
        AND mi."deletedAt" is null
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
          AND "platform" = $(platform)
          AND "deletedAt" is null;
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
): Promise<number> {
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
        WHERE "id" = $(id) 
          AND "memberId" = $(memberId)
          AND "deletedAt" is null;
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
        WHERE value = $(value) 
          AND "memberId" = $(memberId)
          AND "deletedAt" is null
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
): Promise<number> {
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
          WHERE "memberId" = $(memberId) 
            AND "id" = $(id) 
            AND "deletedAt" is null;
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
): Promise<number> {
  return qx.result(
    `
        UPDATE "memberIdentities" SET "deletedAt" = now()
        WHERE "memberId" = $(memberId) AND "id" = $(id) AND "deletedAt" is null;
    `,
    {
      memberId,
      id,
    },
  )
}

export async function moveIdentitiesBetweenMembers(
  qx: QueryExecutor,
  fromMemberId: string,
  toMemberId: string,
  identitiesToMove: IMemberIdentity[],
  identitiesToUpdate: IMemberIdentity[],
): Promise<void> {
  for (const i of identitiesToMove) {
    await moveToNewMember(qx, {
      oldMemberId: fromMemberId,
      newMemberId: toMemberId,
      platform: i.platform,
      value: i.value,
      type: i.type,
    })
  }

  if (identitiesToUpdate.length > 0) {
    for (const i of identitiesToUpdate) {
      // first we remove them from the old member (we can't update and delete at the same time because of a unique index where only one identity can have a verified type:value combination for a tenant, member and platform)
      await deleteMemberIdentities(qx, {
        memberId: fromMemberId,
        platform: i.platform,
        value: i.value,
        type: i.type,
      })

      // then we update verified flag for the identities in the new member
      await updateVerifiedFlag(qx, {
        memberId: toMemberId,
        platform: i.platform,
        value: i.value,
        type: i.type,
        verified: true,
      })
    }
  }
}
