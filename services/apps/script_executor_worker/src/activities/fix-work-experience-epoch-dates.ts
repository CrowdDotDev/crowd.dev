import { fetchMemberWorkExperienceWithEpochDates, pgpQx } from '@crowd/data-access-layer'
import { updateMemberOrg } from '@crowd/data-access-layer/src/old/apps/members_enrichment_worker'
import { IMemberOrganization, IMemberOrganizationData } from '@crowd/types'

import { svc } from '../main'

export async function findMemberWorkExperienceWithEpochDates(
  batchSize: number,
): Promise<IMemberOrganization[]> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return fetchMemberWorkExperienceWithEpochDates(qx, batchSize)
}

export async function updateMemberWorkExperience(
  memberId: string,
  original: IMemberOrganizationData,
  toUpdate: Partial<IMemberOrganization>,
): Promise<void> {
  await svc.postgres.writer.transactionally(async (tx) => {
    await updateMemberOrg(tx.transaction(), memberId, original, toUpdate)
  })
}
