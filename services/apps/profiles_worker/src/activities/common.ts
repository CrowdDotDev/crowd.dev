import {
  getAffiliationsLastCheckedAt as getAffiliationsLastCheckedAtDAL,
  getAllMemberIdsPaginated,
  getMemberIdsWithRecentRoleChanges,
  updateAffiliationsLastCheckedAt as updateAffiliationsLastCheckedAtOfTenant,
} from '@crowd/data-access-layer/src/old/apps/profiles_worker'

import { svc } from '../main'

export async function getAffiliationsLastCheckedAt(): Promise<string> {
  return getAffiliationsLastCheckedAtDAL(svc.postgres.writer)
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
  await updateAffiliationsLastCheckedAtOfTenant(svc.postgres.writer)
}
