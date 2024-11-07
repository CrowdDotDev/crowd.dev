import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { chunkArray } from '@crowd/common'
import { IEnrichableMember, MemberEnrichmentSource } from '@crowd/types'

import * as activities from '../activities/getMembers'
import { IGetMembersForEnrichmentArgs } from '../types'

import { enrichMember } from './enrichMember'

const { getEnrichableMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
})

export async function getMembersToEnrich(args: IGetMembersForEnrichmentArgs): Promise<void> {
  const QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN = 1000
  const PARALLEL_ENRICHMENT_WORKFLOWS = 10
  const afterCursor = args?.afterCursor || null
  const sources = [
    MemberEnrichmentSource.PROGAI,
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.SERP,
    MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER,
    MemberEnrichmentSource.CRUSTDATA,
  ]

  const members = await getEnrichableMembers(
    QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN,
    sources,
    afterCursor,
  )

  if (members.length === 0) {
    return
  }

  const chunks = chunkArray<IEnrichableMember>(members, PARALLEL_ENRICHMENT_WORKFLOWS)

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

  await continueAsNew<typeof getMembersToEnrich>({
    afterCursor: {
      memberId: chunks[chunks.length - 1][chunks[chunks.length - 1].length - 1].id,
      activityCount: chunks[chunks.length - 1][chunks[chunks.length - 1].length - 1].activityCount,
    },
  })
}
