import { DEFAULT_TENANT_ID } from '@crowd/common'
import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'
import { prepareBulkInsert } from '../utils'

export async function insertManyMemberIdentities(
  qx: QueryExecutor,
  identities: {
    memberId: string
    integrationId: string
    platform: string
    sourceId: string
    value: string
    type: MemberIdentityType
    verified: boolean
  }[],
) {
  return qx.result(
    prepareBulkInsert(
      'memberIdentities',
      [
        'memberId',
        'tenantId',
        'integrationId',
        'platform',
        'sourceId',
        'value',
        'type',
        'verified',
      ],
      identities.map((i) => {
        return {
          tenantId: DEFAULT_TENANT_ID,
          ...i,
        }
      }),
      'DO NOTHING',
    ),
  )
}

export async function createMemberIdentity(
  qx: QueryExecutor,
  i: {
    memberId: string
    platform: string
    value: string
    type: MemberIdentityType
    verified: boolean
    sourceId: string
    integrationId: string
  },
) {
  return insertManyMemberIdentities(qx, [i])
}

export async function moveToNewMember(
  qx: QueryExecutor,
  p: {
    oldMemberId: string
    newMemberId: string
    platform: string
    value: string
    type: MemberIdentityType
  },
) {
  return qx.result(
    `
      update "memberIdentities"
      set
        "memberId" = $(newMemberId)
      where
        "memberId" = $(oldMemberId) and
        platform = $(platform) and
        value = $(value) and
        type = $(type);
    `,
    p,
  )
}

export async function deleteMemberIdentitiesByCombinations(
  qx: QueryExecutor,
  p: {
    memberId: string
    platforms: string[]
    values: string[]
    types: MemberIdentityType[]
  },
) {
  return qx.result(
    `
      delete from "memberIdentities"
      where ("memberId", platform, value, type) in
            (select mi."memberId", mi.platform, mi.value, mi.type
            from "memberIdentities" mi
                      join (select $(memberId)::uuid            as memberid,
                                  unnest($(platforms)::text[]) as platform,
                                  unnest($(values)::text[]) as value,
                                  unnest($(types)::text[]) as type) as combinations
                          on mi."memberId" = combinations.memberid
                              and mi.platform = combinations.platform
                              and mi.value = combinations.value
                              and mi.type = combinations.type);
    `,
    {
      memberId: p.memberId,
      platforms: `{${p.platforms.join(',')}}`,
      values: `{${p.values.join(',')}}`,
      types: `{${p.types.join(',')}}`,
    },
  )
}

export async function updateVerifiedFlag(
  qx: QueryExecutor,
  p: {
    memberId: string
    platform: string
    value: string
    type: MemberIdentityType
    verified: boolean
  },
) {
  return qx.result(
    `
      update "memberIdentities"
      set verified = $(verified)
      where
        "memberId" = $(memberId) and
        platform = $(platform) and
        value = $(value) and
        type = $(type)
    `,
    p,
  )
}

export async function deleteMemberIdentities(
  qx: QueryExecutor,
  p: { memberId: string; value: string; type: MemberIdentityType; platform: string },
) {
  return qx.result(
    `
      delete from "memberIdentities"
      where "memberId" = $(memberId) and platform = $(platform) and value = $(value) and type = $(type);
    `,
    p,
  )
}

export async function deleteManyMemberIdentities(
  qx: QueryExecutor,
  {
    memberId,
    identities,
  }: {
    memberId: string
    identities: {
      platform: string
      value: string
      type: MemberIdentityType
    }[]
  },
) {
  const formattedIdentities = identities
    .map((i) => `('${i.platform}', '${i.value}', '${i.type}')`)
    .join(', ')

  return qx.result(
    `
      delete from "memberIdentities"
      where "memberId" = $(memberId) and
      (platform, value, type) in (${formattedIdentities});
    `,
    {
      memberId,
      formattedIdentities,
    },
  )
}

export function upsertMemberIdentity(
  qx: QueryExecutor,
  p: {
    memberId: string
    platform: string
    value: string
    type: MemberIdentityType
    verified: boolean
  },
) {
  return qx.result(
    `
      insert into "memberIdentities" ("memberId", "tenantId", platform, value, type, verified)
      values ($(memberId), $(tenantId), $(platform), $(value), $(type), $(verified))
      on conflict do nothing;
    `,
    { tenantId: DEFAULT_TENANT_ID, ...p },
  )
}

export async function findAlreadyExistingVerifiedIdentities(
  qx: QueryExecutor,
  p: { identities: IMemberIdentity[] },
): Promise<IMemberIdentity[]> {
  const conditions: string[] = []
  const values: string[] = []

  p.identities.forEach((identity, index) => {
    conditions.push(`(mi.platform = $${index * 2 + 1} AND mi.value = $${index * 2 + 2})`)
    values.push(identity.platform, identity.value)
  })

  const whereClause = conditions.length > 0 ? conditions.join(' OR ') : '1=0'

  return qx.select(
    `
    select mi.* from "memberIdentities" mi
    where ${whereClause}
    `,
    values,
  )
}
