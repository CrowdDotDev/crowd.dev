import { DbStore } from '@crowd/data-access-layer/src/database'
import { MemberSyncService, OrganizationSyncService } from '@crowd/opensearch'

import { svc } from '../main'

const syncMembers = new MemberSyncService(
  svc.redis,
  svc.postgres.writer,
  new DbStore(svc.log, svc.questdbSQL),
  svc.opensearch,
  svc.log,
)

const syncOrganizations = new OrganizationSyncService(
  new DbStore(svc.log, svc.questdbSQL),
  svc.postgres.writer,
  svc.opensearch,
  svc.log,
)

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
