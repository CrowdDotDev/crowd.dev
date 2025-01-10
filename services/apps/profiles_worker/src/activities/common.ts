import {
  getAffiliationsLastCheckedAt,
  getAllMemberIdsPaginated,
  getMemberIdsWithRecentRoleChanges,
  updateAffiliationsLastCheckedAt,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'

import { svc } from '../main'

export async function getAffiliationsLastCheckedAtOfTenant(tenantId: string): Promise<string> {
  return getAffiliationsLastCheckedAt(svc.postgres.writer, tenantId)
}

export async function getMemberIdsForAffiliationUpdates(
  affiliationsLastChecked: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  if (!affiliationsLastChecked) {
    return getAllMemberIdsPaginated(svc.postgres.writer, limit, offset)
  }

  return getMemberIdsWithRecentRoleChanges(
    svc.postgres.writer,
    affiliationsLastChecked,
    limit,
    offset,
  )
}

export async function updateAffiliationsLastCheckedAtOfTenant(tenantId: string): Promise<void> {
  await updateAffiliationsLastCheckedAt(svc.postgres.writer, tenantId)
}
