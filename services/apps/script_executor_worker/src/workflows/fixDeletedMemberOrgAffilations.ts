import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IFixDeletedMemberOrgAffilationsArgs } from '../types'

const {
  getProcessedMemberOrgAffiliations,
  calculateMemberAffiliations,
  syncMembersBatch,
  queueOrgForAggComputation,
  deleteProcessedMemberOrgAffiliations,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '45 minutes',
})

export async function fixDeletedMemberOrgAffilations(
  args: IFixDeletedMemberOrgAffilationsArgs,
): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  console.log(
    `Fixing deleted member org affiliations with params: testRun=${args.testRun}, batchSize=${args.batchSize}`,
  )

  // Find affected memberId and orgId
  const affectedMembers = await getProcessedMemberOrgAffiliations(BATCH_SIZE)

  if (affectedMembers.length === 0) {
    console.log('No processed member org affiliations found!')
    return
  }

  const CHUNK_SIZE = 25
  for (let i = 0; i < affectedMembers.length; i += CHUNK_SIZE) {
    const chunk = affectedMembers.slice(i, i + CHUNK_SIZE)
    await Promise.all(
      chunk.map(async ({ memberId, organizationId }) => {
        // Calculate affiliation
        await calculateMemberAffiliations(memberId)

        // Sync member
        await syncMembersBatch([memberId], true)

        // Add orgId to redisCache
        // It will be picked up by the spawnOrganizationAggregatesComputation workflow
        await queueOrgForAggComputation(organizationId)

        await deleteProcessedMemberOrgAffiliations(memberId, organizationId)
      }),
    )
  }

  if (args.testRun) {
    console.log('Test run completed!')
    return
  }

  await continueAsNew<typeof fixDeletedMemberOrgAffilations>(args)
}
