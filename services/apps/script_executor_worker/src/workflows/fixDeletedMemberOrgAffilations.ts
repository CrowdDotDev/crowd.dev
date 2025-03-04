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

  const CHUNK_SIZE = 10
  for (let i = 0; i < affectedMembers.length; i += CHUNK_SIZE) {
    const chunk = affectedMembers.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map(async ({ memberId, organizationId }) => {
        // 2. Check if they have activity in questDb
        const hasActivity = await activity.hasActivityInQuestDb(memberId, organizationId)

        // 2.1 If no activities found, we need to get and insert them
        if (!hasActivity) {
          console.log(`Copying activities for member ${memberId} and org ${organizationId}`)

          await activity.copyActivitiesFromPgToQuestDb(memberId, organizationId)
        }

        // 3. Calculate affiliation
        // await activity.calculateMemberAffiliations(memberId)

        // 4. Sync member
        // await syncActivity.syncMembersBatch([memberId], true)

        // 5. Add orgId to redisCache
        // It will be picked up by the spawnOrganizationAggregatesComputation workflow
        // await activity.addOrgIdToRedisCache(organizationId)

        // 6. Mark member-org affiliation as processed
        await activity.markMemberOrgAffiliationAsProcessed(memberId, organizationId)
      }),
    )
  }

  if (args.testRun) {
    console.log('Test run completed!')
    return
  }

  await continueAsNew<typeof fixDeletedMemberOrgAffilations>(args)
}
