import { proxyActivities } from '@temporalio/workflow'

import * as organizationActivities from '../activities/organizationMergeSuggestions'
import { ITestOrganizationOpenSearchResultsArgs } from '../types'

const organizationActivitiesProxy = proxyActivities<typeof organizationActivities>({
  startToCloseTimeout: '10 minute',
})

export async function testOrganizationOpenSearchResults(
  args: ITestOrganizationOpenSearchResultsArgs,
): Promise<void> {
  const DEFAULT_TENANT_ID = '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f'

  for (const organizationId of args.organizationIds) {
    console.log(`Testing OpenSearch results for organization: ${organizationId}`)

    // First get the organization details
    const results = await organizationActivitiesProxy.getOrganizations(
      DEFAULT_TENANT_ID,
      1,
      null,
      null,
      [organizationId],
    )

    if (results.length === 0) {
      console.log('Organization not found!')
      return
    }

    const organization = results[0]
    console.log('Organization details:')
    console.log(JSON.stringify(organization, null, 2))

    // Get merge suggestions for this organization
    const suggestions = await organizationActivitiesProxy.getOrganizationMergeSuggestions(
      DEFAULT_TENANT_ID,
      organization,
    )

    if (suggestions.length === 0) {
      console.log(`No merge suggestions found for organization ${organizationId} in OpenSearch!`)
      continue
    }

    console.log(`Found ${suggestions.length} potential merge suggestions:`)
    console.log(JSON.stringify(suggestions, null, 2))
  }
}
