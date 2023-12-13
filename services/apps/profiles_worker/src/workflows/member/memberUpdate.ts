import { proxyActivities } from '@temporalio/workflow'

import * as activities from '../../activities'
import { MemberWithIDOnly } from '../../types/member'

// Configure timeouts and retry policies to update a member in the database.
const { updateMemberAffiliations } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60 seconds',
})

/*
memberUpdate is a Temporal workflow that:
  - [Activity]: Update all affiliations for a given member in the database.
*/
export async function memberUpdate(input: MemberWithIDOnly): Promise<void> {
  try {
    await updateMemberAffiliations(input)
  } catch (err) {
    throw new Error(err)
  }
}
