import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { TemporalWorkflowId } from '@crowd/types'

import * as activities from '../activities'
import { IFixMemberAffiliationsArgs } from '../types'

const { getMemberIdsWithDeletedWorkexperiences } = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 minute',
  retry: { maximumAttempts: 3 },
})

export async function fixMemberAffiliations(args: IFixMemberAffiliationsArgs) {
  const MEMBER_PAGE_SIZE = args.testRun ? 10 : 100
  const offset = args.offset || 0

  if (args.testRun) {
    console.log(`Running in test mode with limit 10!`)
  }

  console.log(`Fixing affiliations with offset ${offset || 0}`)

  const memberIds = await getMemberIdsWithDeletedWorkexperiences(MEMBER_PAGE_SIZE, offset)

  console.log('memberIds', memberIds)

  if (memberIds.length === 0) {
    console.log(`No members found with deleted worked experiences!`)
    return
  }

  await Promise.all(
    memberIds.map((id) => {
      return executeChild('memberUpdate', {
        taskQueue: 'profiles',
        workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${args.tenantId}/${id}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          maximumAttempts: 10,
        },
        args: [
          {
            member: {
              id,
            },
          },
        ],
        searchAttributes: {
          TenantId: [args.tenantId],
        },
      })
    }),
  )

  if (!args.testRun) {
    await continueAsNew<typeof fixMemberAffiliations>({
      tenantId: args.tenantId,
      offset: offset + MEMBER_PAGE_SIZE,
      testRun: args.testRun,
    })
  }
}
