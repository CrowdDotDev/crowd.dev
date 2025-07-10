import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { MemberUpdateBulkInput, MemberUpdateInput } from '../../types/member'

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
  try {
    await updateMemberAffiliations(input)
    if (input.syncToOpensearch) {
      // sync member
      await syncMember(input.member.id, input.syncToOpensearch)
      // sync all member organizations
      const organizationIds = input.memberOrganizationIds || []
      for (const orgId of organizationIds) {
        await syncOrganization(orgId, true)
      }
    }
  } catch (err) {
    throw new Error(err)
  }
}

/*
memberUpdateBulk is a Temporal workflow that:
  - [Workflow]: Calls memberUpdate workflow for each member in the list.
  - Note: Does not support memberOrganizationIds - each member is updated individually
*/
export async function memberUpdateBulk(input: MemberUpdateBulkInput): Promise<void> {
  try {
    // Convert member IDs to MemberUpdateInput objects and call memberUpdate for each
    const updatePromises = input.members.map((memberId) => {
      const memberInput: MemberUpdateInput = {
        member: { id: memberId },
        syncToOpensearch: input.syncToOpensearch,
      }
      return memberUpdate(memberInput)
    })

    // Process all member updates in parallel
    await Promise.all(updatePromises)
  } catch (err) {
    throw new Error(err)
  }
}
