import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../activities'
import { IBlockOrganizationAffiliationArgs } from '../types'
import { chunkArray } from '../utils/common'

const { getOrganizationMembers, blockMemberOrganizationAffiliation, calculateMemberAffiliations } =
  proxyActivities<typeof activities>({
    startToCloseTimeout: '30 minutes',
  })

export async function blockOrganizationAffiliation(
  args: IBlockOrganizationAffiliationArgs,
): Promise<void> {
  const MEMBERS_PER_RUN = 500
  const BATCH_SIZE = 50
  const OFFSET = args.offset ?? 0

  const memberOrganizations = await getOrganizationMembers(
    args.organizationId,
    MEMBERS_PER_RUN,
    OFFSET,
  )

  if (memberOrganizations.length === 0) {
    console.log('No more organization members to block!')
    return
  }

  // Step 1: Block all affiliations in batches
  for (const chunk of chunkArray(memberOrganizations, BATCH_SIZE)) {
    await Promise.all(chunk.map((mo) => blockMemberOrganizationAffiliation(mo.memberId, mo.id)))
  }

  // Step 2: Deduplicate memberIds and calculate affiliations
  const uniqueMemberIds = Array.from(new Set(memberOrganizations.map((mo) => mo.memberId)))
  for (const chunk of chunkArray(uniqueMemberIds, BATCH_SIZE)) {
    await Promise.all(chunk.map((memberId) => calculateMemberAffiliations(memberId)))
  }

  // Step 3: Continue pagination
  await continueAsNew<typeof blockOrganizationAffiliation>({
    ...args,
    offset: OFFSET + MEMBERS_PER_RUN,
  })
}
