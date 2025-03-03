import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/fix-deleted-member-org-affilations'
import * as syncActivities from '../activities/sync/member'
import { IFixDeletedMemberOrgAffilationsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const syncActivity = proxyActivities<typeof syncActivities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixDeletedMemberOrgAffilations(
  args: IFixDeletedMemberOrgAffilationsArgs,
): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  console.log(
    `Fixing deleted member org affiliations with params: testRun=${args.testRun}, date=${args.date}, batchSize=${args.batchSize}`,
  )

  // 1. Find affected memberId and orgId
  const affectedMembers = await activity.getMembersWithDeletedOrgAffilations(BATCH_SIZE, args.date)

  if (affectedMembers.length === 0) {
    console.log('No affected members found!')
    return
  }

  for (const { memberId, organizationId } of affectedMembers) {
    // 2. Check if they have activity in questDb
    const activityCount = await activity.getActivities(memberId, organizationId)

    // 2.1 If no activities found, we need to get and insert them
    if (activityCount === 0) {
      console.log(
        `No activities found for member ${memberId} and org ${organizationId}, creating from postgres!`,
      )
      const activities = await activity.findActivitiesPg(memberId, organizationId)
      await activity.createActivities(activities)
    }

    // 3. Calculate affiliation
    console.log(`Calculating member affiliations for ${memberId}`)
    await activity.calculateMemberAffiliations(memberId)

    // 4. sync member
    await syncActivity.syncMembersBatch([memberId], true)

    // 5. Add organizationId to redisCache for sync
    console.log(`Adding org ${organizationId} to redisCache for sync`)
    await activity.addOrgIdToRedisCache(organizationId)
  }

  if (args.testRun) {
    console.log('Test run completed!')
    return
  }

  await continueAsNew<typeof fixDeletedMemberOrgAffilations>(args)
}
