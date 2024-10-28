import { DbConnection } from '@crowd/database'
import { MemberIdentityType } from '@crowd/types'

import { IDbActivity } from '../repo/activity.data'

export async function getTenantIds(db: DbConnection): Promise<string[]> {
  const results = await db.any(`select id from tenants`)
  return results.map((result) => result.id)
}

export async function getMemberIdentityFromUsername(
  db: DbConnection,
  tenantId: string,
  username: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const result = await db.oneOrNone(
    `
      select "memberId", value, type
      from "memberIdentities"
      where "tenantId" = $(tenantId) 
      and value = $(username)
      and type = $(type)
      and platform = 'github'
      `,
    { tenantId, username, type: MemberIdentityType.USERNAME },
  )
  return result
}

export async function getFilteredActivities(
  db: DbConnection,
  tenantId: string,
  { offset = 0, countOnly = false },
): Promise<{ rows: IDbActivity[]; count: number }> {
  const countResult = await db.one(
    `
      select count(*)
      from activities
      where "tenantId" = $(tenantId) 
      and type in ('pull_request-review-requested', 'pull_request-assigned') 
      and "objectMemberId" is null 
      and "objectMemberUsername" is null
      `,
    { tenantId },
  )

  if (countOnly) {
    return { rows: [], count: countResult.count }
  }

  const results = await db.any(
    `
      select *
      from activities
      where "tenantId" = $(tenantId) 
      and type in ('pull_request-review-requested', 'pull_request-assigned') 
      and "objectMemberId" is null 
      and "objectMemberUsername" is null
      limit 100 offset $(offset)
      `,
    { tenantId, offset },
  )

  return { rows: results, count: countResult.count }
}

export async function updateActivity(
  db: DbConnection,
  tenantId: string,
  activityId: string,
  objectMemberId: string,
  objectMemberUsername: string,
): Promise<void> {
  await db.none(
    `
      update activities
      set "objectMemberId" = $(objectMemberId), "objectMemberUsername" = $(objectMemberUsername)
      where "tenantId" = $(tenantId) and id = $(activityId)
      `,
    { tenantId, activityId, objectMemberId, objectMemberUsername },
  )
}
