import { DEFAULT_TENANT_ID } from '@crowd/common'
import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { MEMBER_SELECT_COLUMNS } from '../members/base'
import { IDbMember } from '../old/apps/data_sink_worker/repo/member.data'
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
  failOnConflict = false,
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
      failOnConflict ? undefined : 'DO NOTHING',
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
  const rowCount = await qx.result(
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

  if (rowCount !== 1) {
    throw new Error(
      `Expected 1 row to be updated, but got ${rowCount} when moving identity from ${p.oldMemberId} to ${p.newMemberId}!`,
    )
  }

  return rowCount
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

export async function findMembersByVerifiedEmails(
  qx: QueryExecutor,
  emails: string[],
): Promise<Map<string, IDbMember>> {
  const data = {
    type: MemberIdentityType.EMAIL,
    emails: emails.map((e) => e.toLowerCase()),
  }

  const results = await qx.select(
    `
    with matching_identities as (
      select mi."memberId", mi.value
      from "memberIdentities" mi
      where mi.type = $(type) and mi.verified = true and lower(mi.value) in ($(emails:csv))
      limit ${emails.length}
    )
    select mi.value as "identityValue", ${MEMBER_SELECT_COLUMNS.map((c) => `m."${c}"`).join(', ')}
    from "members" m inner join matching_identities mi on m.id = mi."memberId"
  `,
    data,
  )

  const resultMap = new Map<string, IDbMember>()

  for (const result of results) {
    resultMap.set(result.identityValue, result)
  }

  return resultMap
}

export async function findMembersByVerifiedUsernames(
  qx: QueryExecutor,
  params: { segmentId: string; platform: string; username: string }[],
): Promise<Map<{ platform: string; value: string }, IDbMember>> {
  const orConditions: string[] = []
  let index = 0

  const data: Record<string, string> = {
    type: MemberIdentityType.USERNAME,
  }

  for (const param of params) {
    const platformParam = `platform_${index++}`
    const usernameParam = `username_${index++}`

    orConditions.push(
      `(mi.platform = $(${platformParam}) and lower(mi.value) = $(${usernameParam}))`,
    )

    data[platformParam] = param.platform
    data[usernameParam] = param.username.toLowerCase()
  }

  const results = await qx.select(
    `
      with matching_identities as (
        select mi."memberId", mi.platform, mi.value
        from "memberIdentities" mi
        where mi.type = $(type) and mi.verified = true and (${orConditions.join(' or ')})
        limit ${params.length}
      )
      select mi.platform as "identityPlatform", mi.value as "identityValue", ${MEMBER_SELECT_COLUMNS.map((c) => `m."${c}"`).join(', ')}
      from "members" m inner join matching_identities mi on m.id = mi."memberId"
    `,
    data,
  )

  const resultMap = new Map<{ platform: string; value: string }, IDbMember>()

  for (const result of results) {
    resultMap.set({ platform: result.identityPlatform, value: result.identityValue }, result)
  }

  return resultMap
}

export async function findMembersByIdentities(
  qx: QueryExecutor,
  identities: IMemberIdentity[],
  memberIdToIgnore?: string,
  onlyVerified = false,
): Promise<Map<string, string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {}

  const conditions: string[] = []
  if (memberIdToIgnore) {
    conditions.push('mi."memberId" <> $(memberIdToIgnore)')
    params.memberIdToIgnore = memberIdToIgnore
  }

  if (onlyVerified) {
    conditions.push('mi.verified = true')
  }

  const identityParams = identities
    .map((identity) => `('${identity.platform}', '${identity.value}', '${identity.type}')`)
    .join(', ')

  const result = await qx.select(
    `
    with input_identities (platform, value, type) as (
      values ${identityParams}
    )
    select "memberId", i.platform, i.value, i.type
    from "memberIdentities" mi
      inner join input_identities i on mi.platform = i.platform and mi.value = i.value and mi.type = i.type
    where ${conditions.join(' and ')}
  `,
    params,
  )

  const resultMap = new Map<string, string>()
  result.forEach((row) => {
    resultMap.set(`${row.platform}:${row.type}:${row.value}`, row.memberId)
  })

  return resultMap
}

export async function findIdentitiesForMembers(
  qx: QueryExecutor,
  memberIds: string[],
): Promise<Map<string, IMemberIdentity[]>> {
  const resultMap = new Map<string, IMemberIdentity[]>()

  const results = await qx.select(
    `
      select * from "memberIdentities"
      where "memberId" in ($(memberIds:csv))
    `,
    {
      memberIds,
    },
  )

  for (const memberId of memberIds) {
    const identities = results.filter((r) => r.memberId === memberId)
    resultMap.set(memberId, identities)
  }

  return resultMap
}
