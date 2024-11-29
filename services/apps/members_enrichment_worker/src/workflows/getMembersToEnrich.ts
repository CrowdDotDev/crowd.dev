import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { IEnrichableMember, MemberEnrichmentSource } from '@crowd/types'

import * as activities from '../activities/getMembers'
import { chunkArray } from '../utils/common'

import { enrichMember } from './enrichMember'

const { getEnrichableMembers, getMaxConcurrentRequests } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
})

export async function getMembersToEnrich(): Promise<void> {
  const QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN = 1000
  const sources = [
    MemberEnrichmentSource.PROGAI,
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.SERP,
    MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER,
    MemberEnrichmentSource.CRUSTDATA,
  ]

  const members = await getEnrichableMembers(QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN, sources)

  if (members.length === 0) {
    return
  }

  const parallelEnrichmentWorkflows = await getMaxConcurrentRequests(
    members,
    sources,
    QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN,
  )

  const chunks = chunkArray<IEnrichableMember>(members, parallelEnrichmentWorkflows)

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((member) => {
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
  }

  await continueAsNew<typeof getMembersToEnrich>()
}
