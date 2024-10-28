import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { IMember } from '@crowd/types'

import * as activities from '../../activities'
import { IGetMembersForLFIDEnrichmentArgs } from '../../sources/lfid/types'
import { enrichMemberWithLFAuth0 } from '../lf-auth0/enrichMemberWithLFAuth0'

const { getLFIDEnrichableMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

export async function getMembersForLFIDEnrichment(
  args: IGetMembersForLFIDEnrichmentArgs,
): Promise<void> {
  const MEMBER_ENRICHMENT_PER_RUN = 10
  const afterId = args?.afterId || null
  const members = await getLFIDEnrichableMembers(MEMBER_ENRICHMENT_PER_RUN, afterId)

  if (members.length === 0) {
    return
  }

  await Promise.all(
    members.map((member: IMember) => {
      return executeChild(enrichMemberWithLFAuth0, {
        workflowId: 'member-enrichment-lfid/' + member.tenantId + '/' + member.id,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
        workflowExecutionTimeout: '1 minute',
        retry: {
          backoffCoefficient: 2,
          maximumAttempts: 10,
          initialInterval: 2 * 1000,
          maximumInterval: 30 * 1000,
        },
        args: [member],
        searchAttributes: {
          TenantId: [member.tenantId],
        },
      })
    }),
  )

  await continueAsNew<typeof getMembersForLFIDEnrichment>({
    afterId: members[members.length - 1].id,
  })
}
