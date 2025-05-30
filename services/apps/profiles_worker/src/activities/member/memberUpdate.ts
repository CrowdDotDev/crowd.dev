import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { SearchSyncApiClient } from '@crowd/opensearch'

import { svc } from '../../main'
import { MemberUpdateInput } from '../../types/member'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
a given member.
*/
export async function updateMemberAffiliations(input: MemberUpdateInput): Promise<void> {
  await runMemberAffiliationsUpdate(svc.postgres.writer, svc.questdbSQL, svc.queue, input.member.id)
}

export async function syncMember(memberId: string, withAggs: boolean): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId, { withAggs })
}
