import { findMemberIdsInOrganization } from '@crowd/data-access-layer/src/old/apps/profiles_worker/orgs'
import { SearchSyncApiClient } from '@crowd/opensearch'

import { svc } from '../../main'

export async function findMembersInOrganization(
  organizationId: string,
  limit: number,
  afterMemberId: string,
): Promise<string[]> {
  // Implementation of this function is missing.
  return findMemberIdsInOrganization(svc.postgres.writer, organizationId, limit, afterMemberId)
}

export async function syncOrganization(organizationId: string): Promise<void> {
  const syncApi = new SearchSyncApiClient({
    baseUrl: process.env['CROWD_SEARCH_SYNC_API_URL'],
  })

  await syncApi.triggerOrganizationSync(organizationId, undefined)
}
