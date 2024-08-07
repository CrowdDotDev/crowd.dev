import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { IOrganizationAffiliationUpdateInput } from '../../types/organization'

// Configure timeouts and retry policies to update a member in the database.
const { updateOrganizationAffiliations } = proxyActivities<typeof activities>({
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
    await updateOrganizationAffiliations(input)
    if (input.syncToOpensearch) {
      // sync organization
      await activities.syncOrganization(input.organizationId)
    }
  } catch (err) {
    throw new Error(err)
  }
}
