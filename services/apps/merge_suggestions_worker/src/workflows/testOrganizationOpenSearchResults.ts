import { proxyActivities } from '@temporalio/workflow'

import * as organizationActivities from '../activities/organizationMergeSuggestions'
import { ITestOrganizationOpenSearchResultsArgs } from '../types'

const organizationActivitiesProxy = proxyActivities<typeof organizationActivities>({
  startToCloseTimeout: '10 minute',
})

export async function testOrganizationOpenSearchResults(
  args: ITestOrganizationOpenSearchResultsArgs,
): Promise<void> {
  console.log(`Testing OpenSearch results for organization: ${args.organizationId}`)

  const DEFAULT_TENANT_ID = '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f'

  // First get the organization details
  const results = await organizationActivitiesProxy.getOrganizations(
    DEFAULT_TENANT_ID,
    1,
    null,
    null,
    [args.organizationId],
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
    console.log('No merge suggestions found in OpenSearch!')
    return
  }

  console.log(`Found ${suggestions.length} potential merge suggestions:`)
  console.log(JSON.stringify(suggestions, null, 2))
}
