import {
  ApplicationFailure,
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
  startToCloseTimeout: '15 minutes',
})

export async function getMembersToEnrich(): Promise<void> {
  const QUERY_FOR_ENRICHABLE_MEMBERS_PER_RUN = 1000
  const sources = [
    MemberEnrichmentSource.PROGAI,
    MemberEnrichmentSource.CLEARBIT,
    MemberEnrichmentSource.PROGAI_LINKEDIN_SCRAPER,
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
    try {
      await Promise.all(
        chunk.map((member) => {
          return executeChild(enrichMember, {
            workflowId: 'member-enrichment/' + member.id,
            cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
            parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_REQUEST_CANCEL,
            workflowExecutionTimeout: '30 minutes',
            retry: {
              backoffCoefficient: 2,
              maximumAttempts: 10,
              initialInterval: '60s',
              maximumInterval: '5 minutes',
            },
            args: [member, sources],
          })
        }),
      )
    } catch (err) {
      throw ApplicationFailure.create({
        message: 'Error enriching members!',
        cause: err,
        nonRetryable: true,
      })
    }
  }

  await continueAsNew<typeof getMembersToEnrich>()
}
