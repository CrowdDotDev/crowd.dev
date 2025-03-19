import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as activities from '../activities/fix-deleted-member-org-affilations'
import * as syncActivities from '../activities/sync/member'
import { IFixDeletedMemberOrgAffilationsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

const syncActivity = proxyActivities<typeof syncActivities>({
  startToCloseTimeout: '30 minutes',
})

const commonActivity = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '30 minutes',
})

export async function fixDeletedMemberOrgAffilations(
  args: IFixDeletedMemberOrgAffilationsArgs,
): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  console.log(
    `Fixing deleted member org affiliations with params: testRun=${args.testRun}, batchSize=${args.batchSize}`,
  )

  // Find affected memberId and orgId
  const affectedMembers = await activity.getProcessedMemberOrgAffiliations(BATCH_SIZE)

  if (affectedMembers.length === 0) {
    console.log('No processed member org affiliations found!')
    return
  }

  const CHUNK_SIZE = 10
  for (let i = 0; i < affectedMembers.length; i += CHUNK_SIZE) {
    const chunk = affectedMembers.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map(async ({ memberId, organizationId }) => {
        // Calculate affiliation
        await activity.calculateMemberAffiliations(memberId)

        // Sync member
        await syncActivity.syncMembersBatch([memberId], true)

        // Add orgId to redisCache
        // It will be picked up by the spawnOrganizationAggregatesComputation workflow
        await commonActivity.queueOrganizationForAggComputation(organizationId)

        await activity.deleteProcessedMemberOrgAffiliations(memberId, organizationId)
      }),
    )
  }

  if (args.testRun) {
    console.log('Test run completed!')
    return
  }

  await continueAsNew<typeof fixDeletedMemberOrgAffilations>(args)
}
