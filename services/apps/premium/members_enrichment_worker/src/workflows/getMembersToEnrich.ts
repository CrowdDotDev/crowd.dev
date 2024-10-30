import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { MemberEnrichmentSource } from '@crowd/types'

import * as activities from '../activities/getMembers'
import { IGetMembersForEnrichmentArgs } from '../types'

import { enrichMember } from './enrichMember'

const { getEnrichableMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function getMembersToEnrich(args: IGetMembersForEnrichmentArgs): Promise<void> {
  const MEMBER_ENRICHMENT_PER_RUN = 100
  const afterId = args?.afterId || null
  const sources = [
    MemberEnrichmentSource.PROGAI,
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.SERP,
  ]

  const members = await getEnrichableMembers(MEMBER_ENRICHMENT_PER_RUN, sources, afterId)

  if (members.length === 0) {
    return
  }

  await Promise.all(
    members.map((member) => {
      return executeChild(enrichMember, {
        workflowId: 'member-enrichment/' + member.tenantId + '/' + member.id,
        cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_REQUEST_CANCEL,
        workflowExecutionTimeout: '15 minutes',
        retry: {
          backoffCoefficient: 2,
          maximumAttempts: 10,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [member, sources],
        searchAttributes: {
          TenantId: [member.tenantId],
        },
      })
    }),
  )

  await continueAsNew<typeof getMembersToEnrich>({
    afterId: members[members.length - 1].id,
  })
}
