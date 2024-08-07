import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { MemberUpdateInput } from '../../types/member'

// Configure timeouts and retry policies to update a member in the database.
const { updateMemberAffiliations } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
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
      console.log('started member sync in profiles worker...')
      // sync member
      await activities.syncMember(input.member.id)
      console.log('synced member in profiles worker...')
      // sync all member organizations
      const organizationIds = input.memberOrganizationIds || []
      for (const orgId of organizationIds) {
        await activities.syncOrganization(orgId)
        console.log(`synced member organization ${orgId} in profiles worker...`)
      }
      console.log('finished member syncing...')
    }
  } catch (err) {
    throw new Error(err)
  }
}
