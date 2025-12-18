import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IScriptBatchTestArgs } from '../types'
import { chunkArray } from '../utils/common'

const {
  getBotMembersWithOrgAffiliation,
  removeBotMemberOrganization,
  unlinkOrganizationFromBotActivities,
  syncMember,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
  retry: { maximumAttempts: 3, backoffCoefficient: 3 },
})

export async function fixBotMembersAffiliation(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 100

  const memberIds = await getBotMembersWithOrgAffiliation(BATCH_SIZE)

  if (memberIds.length === 0) {
    console.log('No more bot members to fix!')
    return
  }

  for (const chunk of chunkArray(memberIds, 50)) {
    if (args.testRun) console.log('Processing chunk', chunk)

    const tasks = chunk.map(async (memberId) => {
      await removeBotMemberOrganization(memberId)
      await unlinkOrganizationFromBotActivities(memberId)
      await syncMember(memberId)
    })

    await Promise.all(tasks).catch((err) => {
      console.error('Error fixing bot member affiliation!', err)
    })
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof fixBotMembersAffiliation>(args)
}
