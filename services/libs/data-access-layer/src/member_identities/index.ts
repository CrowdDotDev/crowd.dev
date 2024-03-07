import { QueryExecutor } from '../queryExecutor'
import pgp from 'pg-promise'

function prepareBulkInsert(table: string, columns: string[], objects: object[]) {
  const preparedObjects = objects.map((_, r) => {
    return `(${columns.map((_, c) => `$(rows.r${r}_c${c})`).join(',')})`
  })

  return pgp.as.format(
    `
      INSERT INTO $(table:name) (${columns.map((_, i) => `$(columns.col${i}:name)`).join(',')})
      VALUES ${preparedObjects.join(',')}
    `,
    {
      table,
      columns: columns.reduce((acc, c, i) => {
        acc[`col${i}`] = c
        return acc
      }, {}),
      rows: objects.reduce((acc, row, r) => {
        columns.forEach((c, i) => {
          acc[`r${r}_c${i}`] = row[c]
        })
        return acc
      }, {}),
    },
  )
}

export async function insertManyMemberIdentities(
  qx: QueryExecutor,
  identities: {
    memberId: string
    tenantId: string
    integrationId: string
    platform: string
    sourceId: string
    username: string
  }[],
) {
  return qx.result(
    prepareBulkInsert(
      'memberIdentities',
      ['memberId', 'tenantId', 'integrationId', 'platform', 'sourceId', 'username'],
      identities,
    ),
  )
}

export async function createMemberIdentity(
  qx: QueryExecutor,
  { memberId, platform, username, sourceId, tenantId, integrationId },
) {
  return insertManyMemberIdentities(qx, [
    {
      memberId,
      tenantId,
      integrationId,
      platform,
      sourceId,
      username,
    },
  ])
}

export async function moveToNewMember(
  qx: QueryExecutor,
  { oldMemberId, newMemberId, tenantId, platform, username },
) {
  return qx.result(
    `
      update "memberIdentities"
      set
        "memberId" = $(newMemberId)
      where
        "tenantId" = $(tenantId) and
        "memberId" = $(oldMemberId) and
        platform = $(platform) and
        username = $(username);
    `,
    {
      oldMemberId,
      newMemberId,
      tenantId,
      platform,
      username,
    },
  )
}

export async function deleteMemberIdentitiesByCombinations(
  qx: QueryExecutor,
  { memberId, platforms, usernames, tenantId },
) {
  return qx.result(
    `
      delete from "memberIdentities"
      where ("memberId", "tenantId", "platform", "username") in
            (select mi."memberId", mi."tenantId", mi."platform", mi."username"
            from "memberIdentities" mi
                      join (select $(memberId)::uuid            as memberid,
                                  $(tenantId)::uuid            as tenantid,
                                  unnest($(platforms)::text[]) as platform,
                                  unnest($(usernames)::text[]) as username) as combinations
                          on mi."memberId" = combinations.memberid
                              and mi."tenantId" = combinations.tenantid
                              and mi."platform" = combinations.platform
                              and mi."username" = combinations.username);
    `,
    {
      memberId,
      platforms,
      usernames,
      tenantId,
    },
  )
}

export async function deleteMemberIdentities(qx: QueryExecutor, { memberId, username, platform }) {
  return qx.result(
    `
      delete from "memberIdentities"
      where "memberId" = $(memberId) and platform = $(platform) and username = $(username);
    `,
    {
      memberId,
      username,
      platform,
    },
  )
}

export async function deleteManyMemberIdentities(
  qx: QueryExecutor,
  {
    memberId,
    tenantId,
    identities,
  }: {
    memberId: string
    tenantId: string
    identities: {
      platform: string
      username: string
    }[]
  },
) {
  const formattedIdentities = identities.map((i) => `('${i.platform}', '${i.username}')`).join(', ')

  return qx.result(
    `
      delete from "memberIdentities"
      where "memberId" = $(memberId) and
      "tenantId" = $(tenantId) and
      ("platform", "username") in (${formattedIdentities});
    `,
    {
      memberId,
      tenantId,
      formattedIdentities,
    },
  )
}

export function upsertMemberIdentity(
  qx: QueryExecutor,
  { memberId, tenantId, platform, username },
) {
  return qx.result(
    `
      INSERT INTO "memberIdentities" ("memberId", "tenantId", platform, username)
      VALUES ($(memberId), $(tenantId), $(platform), $(username))
      ON CONFLICT ON CONSTRAINT "memberIdentities_platform_username_tenantId_key" DO UPDATE
      SET username = EXCLUDED.username, "updatedAt" = NOW();
    `,
    {
      memberId,
      tenantId,
      platform,
      username,
    },
  )
}
