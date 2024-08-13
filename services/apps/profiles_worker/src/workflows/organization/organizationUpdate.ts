import { continueAsNew, proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IOrganizationAffiliationUpdateInput } from '../../types/organization'

// Configure timeouts and retry policies to update a member in the database.
const { updateMemberAffiliations, syncOrganization, findMembersInOrganization } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '5 minutes',
})

/*
memberUpdate is a Temporal workflow that:
  - [Activity]: Update all affiliations of members in a given organization in the database.
  - [Activity]: Sync organization to OpenSearch.
*/
export async function organizationUpdate(
  input: IOrganizationAffiliationUpdateInput,
): Promise<void> {
  try {
    const ORGANIZATION_MEMBER_AFFILIATIONS_UPDATED_PER_RUN = 500

    const memberIds = await findMembersInOrganization(
      input.organization.id,
      ORGANIZATION_MEMBER_AFFILIATIONS_UPDATED_PER_RUN,
      input.afterMemberId,
    )

    if (memberIds.length === 0) {
      if (input.syncToOpensearch) {
        // sync organization
        await syncOrganization(input.organization.id)
      }
      return
    }

    for (const memberId of memberIds) {
      await updateMemberAffiliations({ member: { id: memberId } })
    }

    await continueAsNew<typeof organizationUpdate>({
      ...input,
      afterMemberId: memberIds[memberIds.length - 1],
    })
  } catch (err) {
    throw new Error(err)
  }
}
