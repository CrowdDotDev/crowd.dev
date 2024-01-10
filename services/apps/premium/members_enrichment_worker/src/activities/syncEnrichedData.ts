import { MemberSyncService, OrganizationSyncService } from '@crowd/opensearch'

import { svc } from '../main'

const syncMembers = new MemberSyncService(svc.redis, svc.postgres.writer, svc.opensearch, svc.log, {
  edition: process.env['CROWD_EDITION'],
})

const syncOrganizations = new OrganizationSyncService(
  svc.postgres.writer,
  svc.opensearch,
  svc.log,
  {
    edition: process.env['CROWD_EDITION'],
  },
)

/*
syncMembersToOpensearch is a Temporal activity that sync a newly enriched member
in database to OpenSearch.
*/
export async function syncMembersToOpensearch(input: string[]): Promise<void> {
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
