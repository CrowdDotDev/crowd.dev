import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IScriptBatchTestArgs } from '../types'

const {
  getBotMembersWithOrgAffiliation,
  removeBotMemberOrganization,
  unlinkOrganizationFromBotActivities,
  syncMembersBatch,
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

  for (const memberId of memberIds) {
    if (args.testRun) console.log('Processing member', memberId)

    try {
      await removeBotMemberOrganization(memberId)
      await unlinkOrganizationFromBotActivities(memberId)
      await syncMembersBatch([memberId], true)
    } catch (error) {
      console.error('Error fixing bot member affiliation!', error)
      throw error
    }
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof fixBotMembersAffiliation>(args)
}
