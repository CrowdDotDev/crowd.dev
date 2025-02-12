import { proxyActivities } from '@temporalio/workflow'

import * as commonActivities from '../activities/common'
import * as activities from '../activities/merge-members'
import { IFixUnfinishedMemberMergeArgs } from '../types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function fixUnfinishedMemberMerge(args: IFixUnfinishedMemberMergeArgs): Promise<void> {
  const mergeActions = await activity.findUnfinishedMergeActions()
  const actionsToProcess = args.testRun ? mergeActions.slice(0, 1) : mergeActions

  console.log(
    `Found ${mergeActions.length} unfinished merge actions with last step 'merge-started'!`,
  )

  for (const mergeAction of actionsToProcess) {
    console.log(`Deleting merge action ${mergeAction.id}`)
    await activity.deleteMergeAction(mergeAction.id)
    console.log(`Triggering merge ${mergeAction.primaryId} and ${mergeAction.secondaryId}`)
    await common.mergeMembers(mergeAction.primaryId, mergeAction.secondaryId, mergeAction.tenantId)
  }

  console.log('Done!')
}
