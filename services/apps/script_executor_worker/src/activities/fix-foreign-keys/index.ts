import { moveActivitiesToNewOrg } from '@crowd/data-access-layer/src/old/apps/entity_merging_worker/orgs'
import { QueryExecutor, pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { SearchSyncApiClient } from '@crowd/opensearch'

import { svc } from '../../main'

interface MergedOrganization {
  secondaryId: string
  primaryId: string
}

async function getMergedOrganizations(pgQx: QueryExecutor): Promise<MergedOrganization[]> {
  return pgQx.select(`
    SELECT ma."secondaryId", ma."primaryId"
    FROM (
      SELECT DISTINCT ON ("secondaryId") "secondaryId", "primaryId", "createdAt"
      FROM "mergeActions"
      WHERE type = 'organization' AND state = 'merged'
      ORDER BY "secondaryId", "createdAt" DESC
    ) ma
    WHERE NOT EXISTS (
      SELECT 1 
      FROM organizations
      WHERE organizations.id = ma."secondaryId"
    );
  `)
}

async function getActivitiesCount(qdbQx: QueryExecutor, organizationId: string): Promise<number> {
  const { count } = await qdbQx.selectOne(
    `SELECT COUNT(*) as count FROM activities WHERE "organizationId" = $1`,
    [organizationId],
  )
  return count
}

async function updateActivitiesOrganizationId(
  secondaryId: string,
  primaryId: string,
): Promise<boolean> {
  try {
    console.log(`update activities for org ${secondaryId} to ${primaryId}`)
    await moveActivitiesToNewOrg(
      svc.questdbSQL,
      svc.postgres.writer.connection(),
      svc.queue,
      primaryId,
      secondaryId,
    )
    const syncStart = new Date()
    console.log(`syncStart: ${syncStart}`)
    const syncApi = new SearchSyncApiClient({
      baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
    })

    await syncApi.triggerOrganizationSync(primaryId)
    await syncApi.triggerOrganizationMembersSync(primaryId, null, syncStart)
    console.log(`synced org ${primaryId}`)
    return true
  } catch (error) {
    console.error(`ERROR: ${error}`)
    return false
  }
}

export async function fixForeignKeys() {
  console.log('Starting merged organization activities sync')

  const pgQx = pgpQx(svc.postgres.reader.connection())
  const qdbQx = pgpQx(svc.questdbSQL)
  let totalActivities = 0
  let totalOrgs = 0

  const mergedOrgs = await getMergedOrganizations(pgQx)

  console.log(`Found ${mergedOrgs.length} merged orgs to process`)

  for (const org of mergedOrgs) {
    totalOrgs += 1
    const activitiesCount = await getActivitiesCount(qdbQx, org.secondaryId)

    if (activitiesCount === 0) {
      console.log(`No activities found for org ${org.secondaryId}`)
    } else {
      totalActivities += activitiesCount
      console.log(`Found ${activitiesCount} activities for org ${org.secondaryId}`)

      //   console.log(`update activities for org ${org.secondaryId}`)
      //   const success = await updateActivitiesOrganizationId(org.secondaryId, org.primaryId)

      //   if (success) {
      //     console.log(
      //       `Successfully updated ${activitiesCount} activities from ${org.secondaryId} to ${org.primaryId}`,
      //     )
      //   } else {
      //     console.error(`Failed to update activities for org ${org.secondaryId}`)
      //   }
    }
  }

  console.log(`Total activities: ${totalActivities}`)
  console.log(`Total orgs: ${totalOrgs}`)
}
