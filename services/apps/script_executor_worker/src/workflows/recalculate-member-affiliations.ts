import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IRecalculateMemberAffiliationsArgs } from '../types'
import { chunkArray } from '../utils/common'

const { calculateMemberAffiliations } = proxyActivities<typeof activities>({
  startToCloseTimeout: '90 minutes',
})

export async function recalculateMemberAffiliations(
  args: IRecalculateMemberAffiliationsArgs,
): Promise<void> {
  const memberIds = args.memberIds

  console.log(`Found ${memberIds?.length} members to recalculate affiliations!`)

  if (memberIds?.length === 0) {
    console.log('No more members to recalculate affiliations!')
    return
  }

  for (const chunk of chunkArray(memberIds, 10)) {
    await Promise.all(chunk.map((memberId) => calculateMemberAffiliations(memberId)))
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof recalculateMemberAffiliations>(args)
}
