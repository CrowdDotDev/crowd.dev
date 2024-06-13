import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  proxyActivities,
  startChild,
  workflowInfo,
} from '@temporalio/workflow'

import * as activities from '../activities/dissect-member'
import * as commonActivities from '../activities/common'
import { IDissectMemberArgs } from '../types'
import { IMemberUnmergeBackup, IUnmergeBackup, MemberIdentityType } from '@crowd/types'

const activity = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

const common = proxyActivities<typeof commonActivities>({
  startToCloseTimeout: '10 minute',
  retry: { maximumAttempts: 1, backoffCoefficient: 3 },
})

export async function dissectMember(args: IDissectMemberArgs): Promise<void> {
  const info = workflowInfo()

  // check if memberId exist in db before unmerging
  const member = await activity.findMemberById(args.memberId)

  if (!member) {
    console.log(`memberId ${args.memberId} not found!`)
    return
  }

  const DEFAULT_MERGE_ACTIONS_PAGE_SIZE = 10

  const mergeActionPageSize = args.undoActionPerWorkflow || DEFAULT_MERGE_ACTIONS_PAGE_SIZE

  if (args.forceSplitAllIdentities) {
    const memberIdentitiesGroupedByPlatform = await activity.findMemberIdentitiesGroupedByPlatform(
      args.memberId,
    )

    if (memberIdentitiesGroupedByPlatform.length <= 1) {
      console.log(`Member already has one group of identities!`)
      return
    }

    // we'll keep the last group in the current member and create new members for the remaining
    memberIdentitiesGroupedByPlatform.pop()

    for (const groupedIdentities of memberIdentitiesGroupedByPlatform) {
      // 1. get payload for identity split using unmergePreview endpoint
      const preview = await common.unmergeMembersPreview(
        groupedIdentities.tenantId,
        args.memberId,
        {
          platform: groupedIdentities.platforms[0],
          type: groupedIdentities.types[0] as MemberIdentityType,
          verified: groupedIdentities.verified[0],
          value: groupedIdentities.values[0],
        },
      )
      // 2. Currently unmerge preview only supports a single identity as input. Add grouped identities to secondary payload
      // and remove the grouped identities from the primary payload
      const toMove = preview.primary.identities.filter(
        (identity) => identity.value.toLowerCase() === groupedIdentities.groupedByValue,
      )

      preview.primary.identities = preview.primary.identities.filter(
        (identity) => identity.value.toLowerCase() !== groupedIdentities.groupedByValue,
      )

      preview.secondary.identities = [...preview.secondary.identities, ...toMove]

      console.log(
        `Identity [${groupedIdentities.groupedByValue}] will be split from [${args.memberId}] into member ${preview.secondary.id}!`,
      )

      // 2. call api.unmerge using the payload
      await common.unmergeMembers(args.memberId, preview, groupedIdentities.tenantId)
    }
  } else {
    const mergeActions = await activity.findMemberMergeActions(
      args.memberId,
      args.startDate,
      args.endDate,
      args.userId,
      mergeActionPageSize,
    )

    for (const mergeAction of mergeActions) {
      // 1. call api.unmerge using backups
      // 2. wait for temporal async stuff to complete
      // 3. call the same workflow again for the unmerged secondary member

      await common.unmergeMembers(
        mergeAction.primaryId,
        mergeAction.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>,
        mergeAction.tenantId,
      )

      const workflowId = `finishMemberUnmerging/${mergeAction.primaryId}/${mergeAction.secondaryId}`

      await common.waitForTemporalWorkflowExecutionFinish(workflowId)

      await startChild(dissectMember, {
        workflowId: `${info.workflowId}/${mergeAction.secondaryId}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [
          {
            ...args,
            memberId: mergeAction.secondaryId,
          },
        ],
        searchAttributes: {
          TenantId: [mergeAction.tenantId],
        },
      })

      console.log(
        `Finished unmerging member ${mergeAction.secondaryId} from ${mergeAction.primaryId}!`,
      )
    }

    if (mergeActions.length === mergeActionPageSize) {
      await continueAsNew<typeof dissectMember>(args)
    }
  }
}
