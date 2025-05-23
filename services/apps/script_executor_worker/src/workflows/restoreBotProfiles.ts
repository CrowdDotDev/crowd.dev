import { continueAsNew, proxyActivities } from '@temporalio/workflow'
import { log } from '@temporalio/workflow'

import * as activities from '../activities'
import { IScriptBatchTestArgs } from '../types'

const { getMembersManuallyMarkedAsBots, updateMemberAttributesAndManuallyChangedFields } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 minutes',
    retry: { maximumAttempts: 3, backoffCoefficient: 3 },
  })

export async function restoreBotProfiles(args: IScriptBatchTestArgs): Promise<void> {
  const BATCH_SIZE = args.batchSize ?? 200

  const botMembers = await getMembersManuallyMarkedAsBots(BATCH_SIZE)

  if (botMembers.length === 0) {
    console.log('No more bot members to restore!')
    return
  }

  for (const member of botMembers) {
    if (args.testRun) {
      log.info(`Restoring bot profile for member ${member.id}`, {
        attributes: member.attributes,
        manuallyChangedFields: member.manuallyChangedFields,
      })
    }

    member.manuallyChangedFields = [...new Set(member.manuallyChangedFields)]
    member.attributes.isBot.default = 'true'

    await updateMemberAttributesAndManuallyChangedFields(
      member.id,
      member.attributes,
      member.manuallyChangedFields,
    )
  }

  if (args.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  // Continue as new for the next batch
  await continueAsNew<typeof restoreBotProfiles>(args)
}
