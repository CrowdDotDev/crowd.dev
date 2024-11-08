import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { TemporalWorkflowId } from '@crowd/types'

import { memberUpdate } from '../../../profiles_worker/src/workflows/member/memberUpdate'
import * as activities from '../activities'
import { IFixMemberAffiliationsArgs } from '../types'

const { getMemberIdsWithDeletedWorkexperiences } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
})

export async function fixMemberAffiliations(args: IFixMemberAffiliationsArgs) {
  const MEMBER_PAGE_SIZE = 100
  const offset = args.offset || 0

  const memberIds = await getMemberIdsWithDeletedWorkexperiences(
    args.tenantId,
    MEMBER_PAGE_SIZE,
    offset,
  )

  if (memberIds.length === 0) {
    console.log(`No members found with deleted worked experiences!`)
    return
  }

  await Promise.all(
    memberIds.map((id) => {
      return executeChild(memberUpdate, {
        workflowId: `${TemporalWorkflowId.MEMBER_UPDATE}/${args.tenantId}/${id}`,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        retry: {
          backoffCoefficient: 2,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
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

  await continueAsNew<typeof fixMemberAffiliations>({
    tenantId: args.tenantId,
    offset: offset + MEMBER_PAGE_SIZE,
  })
}
