import {
  proxyActivities,
  ParentClosePolicy,
  ChildWorkflowCancellationType,
  executeChild,
  // continueAsNew,
} from '@temporalio/workflow'

import * as activities from '../activities/getMembers'
import { enrichMember } from './enrichMember'
import { IGetMembersForEnrichmentArgs } from '../types'
import { MemberEnrichmentSource } from '@crowd/types'

// Configure timeouts and retry policies to retrieve members to enrich from the
// database.
const { getMembers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
})

/*
getMembersToEnrich is a Temporal workflow that:
  - [Activity]: Get a set of available members to enrich.
  - [Child Workflow]: Enrich, update, and sync everything related to the member
    and their organizations in the database and OpenSearch. Child workflows are
    completely "detached" from the parent workflow, meaning they will continue
    to run and not be cancelled even if this one is.
*/
export async function getMembersToEnrich(args: IGetMembersForEnrichmentArgs): Promise<void> {
  const MEMBER_ENRICHMENT_PER_RUN = 300
  const afterId = args?.afterId || null
  const sources = [MemberEnrichmentSource.PROGAI, MemberEnrichmentSource.CLEARBIT]

  const members = await getMembers(MEMBER_ENRICHMENT_PER_RUN, sources, afterId)

  await Promise.all(
    members.map((member) => {
      return executeChild(enrichMember, {
        workflowId: 'member-enrichment/' + member.tenantId + '/' + member.id,
        cancellationType: ChildWorkflowCancellationType.ABANDON,
        parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
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

  /*
  if (!IS_DEV_ENV) {
    await continueAsNew<typeof getMembersToEnrich>({
      afterId: members[members.length - 1].id,
    })
  }
  */
}
