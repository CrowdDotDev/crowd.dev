import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  executeChild,
  proxyActivities,
} from '@temporalio/workflow'

import { IEnrichableOrganization, OrganizationEnrichmentSource } from '@crowd/types'

import * as activities from '../activities'
import { ITriggerOrganizationsEnrichmentInput } from '../types'
import { chunkArray } from '../utils/common'
import { enrichOrganization } from '../workflows'

const { getEnrichableOrganizations, getMaxConcurrentRequests } = proxyActivities<typeof activities>(
  {
    startToCloseTimeout: '10 minutes',
  },
)

export async function triggerOrganizationsEnrichment(
  input: ITriggerOrganizationsEnrichmentInput,
): Promise<void> {
  const QUERY_FOR_ENRICHABLE_ORGANIZATIONS_PER_RUN = input.perRunLimit ?? 500
  const source = OrganizationEnrichmentSource.LFX_INTERNAL_API

  const organizations = await getEnrichableOrganizations(
    QUERY_FOR_ENRICHABLE_ORGANIZATIONS_PER_RUN,
    [source],
  )

  if (organizations.length === 0) {
    return
  }

  const parallelEnrichmentWorkflows = await getMaxConcurrentRequests(
    organizations,
    [source],
    QUERY_FOR_ENRICHABLE_ORGANIZATIONS_PER_RUN,
  )

  const chunks = chunkArray<IEnrichableOrganization>(organizations, parallelEnrichmentWorkflows)

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map((organization) => {
        return executeChild(enrichOrganization, {
          workflowId: 'organization-enrichment/' + organization.id,
          cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
          parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_REQUEST_CANCEL,
          workflowExecutionTimeout: '15 minutes',
          retry: {
            backoffCoefficient: 2,
            maximumAttempts: 10,
            initialInterval: '60s',
            maximumInterval: '5 minutes',
          },
          args: [organization, source],
        })
      }),
    )
  }

  if (input.testRun) {
    console.log('Test run completed - stopping after first batch!')
    return
  }

  await continueAsNew<typeof triggerOrganizationsEnrichment>({ ...input })
}
