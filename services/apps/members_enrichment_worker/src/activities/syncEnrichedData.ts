import { MemberSyncService, OrganizationSyncService } from '@crowd/opensearch'

import { svc } from '../service'

const syncMembers = new MemberSyncService(svc.redis, svc.postgres.writer, svc.opensearch, svc.log)

const syncOrganizations = new OrganizationSyncService(svc.postgres.writer, svc.opensearch, svc.log)

/*
syncMembersToOpensearch is a Temporal activity that sync a newly enriched member
in database to OpenSearch.
*/
export async function syncMembersToOpensearch(input: string): Promise<void> {
  try {
    syncMembers.syncMembers(input)
  } catch (err) {
    throw new Error(err)
  }

  return null
}

/*
syncOrganizationsToOpensearch is a Temporal activity that sync newly enriched
organizations in database to OpenSearch.
*/
export async function syncOrganizationsToOpensearch(input: string[]): Promise<void> {
  try {
    syncOrganizations.syncOrganizations(input)
  } catch (err) {
    throw new Error(err)
  }

  return null
}
