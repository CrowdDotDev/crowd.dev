import { getDefaultTenantId } from '@crowd/common'
import {
  getAffiliationsLastCheckedAt as getAffiliationsLastCheckedAtOfTenant,
  getAllMemberIdsPaginated,
  getMemberIdsWithRecentRoleChanges,
  updateAffiliationsLastCheckedAt as updateAffiliationsLastCheckedAtOfTenant,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'

import { svc } from '../main'

export async function getAffiliationsLastCheckedAt(): Promise<string> {
  const tenantId = getDefaultTenantId()
  return getAffiliationsLastCheckedAtOfTenant(svc.postgres.writer, tenantId)
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

export async function updateAffiliationsLastCheckedAt(): Promise<void> {
  const tenantId = getDefaultTenantId()
  await updateAffiliationsLastCheckedAtOfTenant(svc.postgres.writer, tenantId)
}
