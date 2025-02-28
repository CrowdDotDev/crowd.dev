import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities/fix-member-affilations'
import * as syncActivities from '../activities/sync/member'
import { IFixMemberAffilationsArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

const syncActivity = proxyActivities<typeof syncActivities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixMemberAffilations(args: IFixMemberAffilationsArgs): Promise<void> {
  const limit = args.limit || 200
  const offset = args.offset || 0

  console.log(
    `Fixing member affiliations for segment ${args.segmentId} with limit ${limit} and offset ${offset}`,
  )

  const memberIds = await activity.getSegmentMembers(args.segmentId, limit, offset)

  if (memberIds.length === 0) {
    console.log('No more members to fix!')
    return
  }

  for (const memberId of memberIds) {
    // 1. Calculate the affiliations
    await activity.calculateMemberAffiliations(memberId)
    // 2. Resync the member
    await syncActivity.syncMembersBatch([memberId], true)
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof fixMemberAffilations>({
    ...args,
    offset: offset + limit,
  })
}
