import { refreshMemberOrganizationAffiliations } from '@crowd/data-access-layer/src/member-organization-affiliation'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { SearchSyncApiClient } from '@crowd/opensearch'

import { svc } from '../../main'

/*
updateMemberAffiliations is a Temporal activity that updates all affiliations for
a given member.
*/
export async function updateMemberAffiliations(memberId: string): Promise<void> {
  const qx = pgpQx(svc.postgres.writer.connection())
  await refreshMemberOrganizationAffiliations(qx, memberId)
}

export async function syncMember(memberId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerMemberSync(memberId)
}
