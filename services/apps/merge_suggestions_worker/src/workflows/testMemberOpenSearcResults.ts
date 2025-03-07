import { proxyActivities } from '@temporalio/workflow'

import * as memberActivities from '../activities/memberMergeSuggestions'
import { ITestMemberOpenSearchResultsArgs } from '../types'

const memberActivitiesProxy = proxyActivities<typeof memberActivities>({
  startToCloseTimeout: '10 minute',
})

export async function testMemberOpenSearchResults(
  args: ITestMemberOpenSearchResultsArgs,
): Promise<void> {
  console.log(`Testing OpenSearch results for member: ${args.memberId}`)

  const DEFAULT_TENANT_ID = '875c38bd-2b1b-4e91-ad07-0cfbabb4c49f'

  // First get the member details
  const results = await memberActivitiesProxy.getMembers(DEFAULT_TENANT_ID, 1, args.memberId, null)

  if (results.length === 0) {
    console.log('Member not found!')
    return
  }

  const member = results[0]
  console.log('Member details:')
  console.log(JSON.stringify(member, null, 2))

  // Get merge suggestions for this member
  const suggestions = await memberActivitiesProxy.getMemberMergeSuggestions(
    DEFAULT_TENANT_ID,
    member,
  )

  if (suggestions.length === 0) {
    console.log('No merge suggestions found in OpenSearch!')
    return
  }

  console.log(`Found ${suggestions.length} potential merge suggestions:`)
  console.log(JSON.stringify(suggestions, null, 2))
}
