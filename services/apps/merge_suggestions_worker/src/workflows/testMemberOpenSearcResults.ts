import { proxyActivities } from '@temporalio/workflow'

import { DEFAULT_TENANT_ID } from '@crowd/common'
import { IMemberMergeSuggestion } from '@crowd/types'

import * as activities from '../activities/memberMergeSuggestions'

const memberActivities = proxyActivities<typeof activities>({ startToCloseTimeout: '1 minute' })

export async function testMemberOpenSearchResults(args: { memberId: string }): Promise<void> {
  console.log(`Testing OpenSearch results for member: ${args.memberId}`)

  // First get the member details
  const members = await memberActivities.getMembers(DEFAULT_TENANT_ID, 1, args.memberId, null)

  if (members.length === 0) {
    console.log('Member not found!')
    return
  }

  const member = members[0]
  console.log('Member details:')
  console.log(JSON.stringify(member, null, 2))

  // Get merge suggestions for this member
  const mergeSuggestions: IMemberMergeSuggestion[] =
    await memberActivities.getMemberMergeSuggestions(DEFAULT_TENANT_ID, member)

  if (mergeSuggestions.length === 0) {
    console.log('No merge suggestions found in OpenSearch!')
    return
  }

  console.log(`Found ${mergeSuggestions.length} potential merge suggestions:`)
  console.log(JSON.stringify(mergeSuggestions, null, 2))

  // Get full details of suggested members
  for (const suggestion of mergeSuggestions) {
    const [primaryId, secondaryId] = suggestion.members
    const memberDetails = await memberActivities.getMembersForLLMConsumption([
      primaryId,
      secondaryId,
    ])

    console.log('\nSuggested merge pair:')
    console.log(`Similarity score: ${suggestion.similarity}`)
    console.log('Member 1:', JSON.stringify(memberDetails[0], null, 2))
    console.log('Member 2:', JSON.stringify(memberDetails[1], null, 2))
  }
}
