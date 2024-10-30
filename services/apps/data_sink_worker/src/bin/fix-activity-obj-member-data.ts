import { DbConnection, getDbConnection } from '@crowd/data-access-layer/src/database'
import {
  getFilteredActivities,
  getMemberIdentityFromUsername,
  getTenantIds,
  updateActivity,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/scripts/fix-activity-obj-member-data'
import { getServiceLogger } from '@crowd/logging'

import { DB_CONFIG } from '../conf'

/* eslint-disable @typescript-eslint/no-explicit-any */

const log = getServiceLogger()

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
