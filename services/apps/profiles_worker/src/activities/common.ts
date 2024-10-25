import {
  getAffiliationsLastCheckedAt,
  getAllMemberIdsPaginated,
  getAllTenants as getAllTenantsFromDAL,
  getMemberIdsWithRecentRoleChanges,
  updateAffiliationsLastCheckedAt,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import { ITenant } from '@crowd/types'

import { svc } from '../main'

export async function getAffiliationsLastCheckedAtOfTenant(tenantId: string): Promise<string> {
  return getAffiliationsLastCheckedAt(svc.postgres.writer, tenantId)
}

export async function getMemberIdsForAffiliationUpdates(
  tenantId: string,
  affiliationsLastChecked: string,
  limit: number,
  offset: number,
): Promise<string[]> {
  if (!affiliationsLastChecked) {
    return getAllMemberIdsPaginated(svc.postgres.writer, tenantId, limit, offset)
  }

  return getMemberIdsWithRecentRoleChanges(
    svc.postgres.writer,
    tenantId,
    affiliationsLastChecked,
    limit,
    offset,
  )
}

export async function updateAffiliationsLastCheckedAtOfTenant(tenantId: string): Promise<void> {
  await updateAffiliationsLastCheckedAt(svc.postgres.writer, tenantId)
}

export async function getAllTenants(): Promise<ITenant[]> {
  return getAllTenantsFromDAL(svc.postgres.writer)
}
