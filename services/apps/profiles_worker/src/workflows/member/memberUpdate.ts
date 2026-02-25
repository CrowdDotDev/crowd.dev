import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { MemberUpdateInput } from '../../types/member'

// Configure timeouts and retry policies to update a member in the database.
const { updateMemberAffiliations, syncOrganization, syncMember } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '60 minutes',
})

/*
memberUpdate is a Temporal workflow that:
  - [Activity]: Update all affiliations for a given member in the database.
  - [Activity]: Sync member and memberOrganizations to OpenSearch if specified.
*/
export async function memberUpdate(input: MemberUpdateInput): Promise<void> {
  const memberId = input.member.id
  try {
    await updateMemberAffiliations(memberId)
    if (input.syncToOpensearch) {
      // sync member
      await syncMember(memberId)
      // sync all member organizations
      const organizationIds = input.memberOrganizationIds || []
      for (const orgId of organizationIds) {
        await syncOrganization(orgId)
      }
    }
  } catch (err) {
    throw new Error(err)
  }
}
