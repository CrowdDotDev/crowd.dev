import { DbConnection, getDbConnection } from '@crowd/database'
import { getServiceLogger } from '@crowd/logging'
import { DB_CONFIG } from '../conf'
import { IDbActivity } from 'repo/activity.data'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

async function getTenantIds(db: DbConnection): Promise<string[]> {
  const results = await db.any(`select id from tenants`)
  return results.map((result) => result.id)
}

async function getMemberIdentityFromUsername(
  db: DbConnection,
  tenantId: string,
  username: string,
): Promise<any> {
  const result = await db.oneOrNone(
    `
      select "memberId", "username"
      from "memberIdentities"
      where "tenantId" = $(tenantId) 
      and username = $(username)
      and platform = 'github'
      `,
    { tenantId, username },
  )
  return result
}

async function getFilteredActivities(
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

async function updateActivity(
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

async function fixActivitiesWithoutObjectMemberData(
  db: DbConnection,
  tenantId: string,
): Promise<void> {
  const BATCH_SIZE = 100

  let offset
  let fixableActivities
  let processedActivities = 0

  const totalActivities = (await getFilteredActivities(db, tenantId, { countOnly: true })).count
  log.info({ tenantId }, `Found ${totalActivities} activities!`)

  do {
    offset = fixableActivities ? offset + BATCH_SIZE : 0
    const result = await getFilteredActivities(db, tenantId, { offset })
    fixableActivities = result.rows

    for (const activity of fixableActivities) {
      const parts = activity.sourceId.split('_')
      const username = parts[parts.length - 2] // objectMemberUsername is always the second last element

      const memberIdentity = await getMemberIdentityFromUsername(db, tenantId, username)

      if (!memberIdentity) {
        log.info({ tenantId, activityId: activity.id, username }, 'no objectMember for activity')
        continue // skip this activity
      }

      await updateActivity(
        db,
        tenantId,
        activity.id,
        memberIdentity.memberId,
        memberIdentity.username,
      )

      processedActivities += 1
      log.info(`Processed ${processedActivities}/${totalActivities} activities`)
    }
  } while (fixableActivities.length > 0)
}

setImmediate(async () => {
  const db = await getDbConnection(DB_CONFIG())
  const tenantIds = await getTenantIds(db)

  const totalTenants = tenantIds.length
  let processedTenants = 0

  log.info('Started fixing activities without objectMemberId and objectMemberUsername!')

  for (const tenantId of tenantIds) {
    await fixActivitiesWithoutObjectMemberData(db, tenantId)
    processedTenants += 1
    log.info({ tenantId }, `Finished processing ${processedTenants}/${totalTenants} tenants`)
  }

  log.info('Done processing all tenants!')

  process.exit(0)
})
