import { SearchSyncApiClient } from '../../../../../libs/opensearch/src'
import { svc } from '../../main'
import { MemberUpdateInput } from '../../types/member'
import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
a given member.
*/
export async function updateMemberAffiliations(input: MemberUpdateInput): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(svc.postgres.writer, input.member.id)
  } catch (err) {
    throw new Error(err)
  }
}

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId)
}
