import {
  ChildWorkflowCancellationType,
  ParentClosePolicy,
  continueAsNew,
  proxyActivities,
  startChild,
} from '@temporalio/workflow'

import * as activities from '../activities'
import { IBlockOrganizationAffiliationArgs } from '../types'
import { chunkArray } from '../utils/common'

import { recalculateMemberAffiliations } from './recalculate-member-affiliations'

const {
  fetchProjectMemberOrganizationsToBlock,
  blockMemberOrganizationAffiliation,
  markMemberForAffiliationRecalc,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 minutes',
})

export async function blockProjectOrganizationAffiliations(
  args: IBlockOrganizationAffiliationArgs,
): Promise<void> {
  const MEMBERS_PER_RUN = 1000
  const afterId = args.afterId ?? undefined

  const memberOrganizations = await fetchProjectMemberOrganizationsToBlock(MEMBERS_PER_RUN, afterId)

  if (memberOrganizations?.length === 0) {
    console.log('No more organization members to block!')

    await startChild(recalculateMemberAffiliations, {
      workflowId: `recalculateMemberAffiliations/${Date.now()}`,
      cancellationType: ChildWorkflowCancellationType.ABANDON,
      parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
      retry: {
        backoffCoefficient: 2,
        initialInterval: 2 * 1000,
        maximumInterval: 30 * 1000,
      },
      args: [
        {
          batchSize: 500,
        },
      ],
    })

    return
  }

  const CONCURRENCY = 10
  const BATCH_SIZE = 50

  // Step 1: Block affiliations in batches
  const batches = chunkArray(memberOrganizations, BATCH_SIZE).map((chunk) =>
    chunk.map((mo) => ({
      memberId: mo.memberId,
      memberOrganizationId: mo.id,
      allowAffiliation: false,
    })),
  )

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const slice = batches.slice(i, i + CONCURRENCY)
    await Promise.all(slice.map((batch) => blockMemberOrganizationAffiliation(batch)))
  }

  // Step 2: Deduplicate memberIds and mark for affiliation recalculation
  const uniqueMemberIds = Array.from(new Set(memberOrganizations.map((mo) => mo.memberId)))

  await markMemberForAffiliationRecalc(uniqueMemberIds)

  const lastProcessedId = memberOrganizations[memberOrganizations.length - 1]?.id

  // Step 3: Continue pagination
  await continueAsNew<typeof blockProjectOrganizationAffiliations>({
    ...args,
    afterId: lastProcessedId,
  })
}
