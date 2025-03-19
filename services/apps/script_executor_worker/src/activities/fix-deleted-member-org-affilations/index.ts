import { insertActivities } from '@crowd/data-access-layer'
import { IDbActivity } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import TempRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/temp.repo'

import { svc } from '../../main'

export async function getMembersWithDeletedOrgAffilations(
  limit: number,
): Promise<{ memberId: string; organizationId: string }[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getMembersWithDeletedOrgAffilations(limit)
  } catch (err) {
    throw new Error(err)
  }
}

export async function hasActivityInQuestDb(
  memberId: string,
  organizationId: string,
): Promise<boolean> {
  const repo = new ActivityRepository(svc.postgres.reader.connection(), svc.log, svc.questdbSQL)
  return repo.hasActivity(memberId, organizationId)
}

export async function copyActivitiesFromPgToQuestDb(
  memberId: string,
  orgId: string,
): Promise<void> {
  let offset = 0
  let activities: IDbActivity[] = []

  const repo = new ActivityRepository(svc.postgres.reader.connection(), svc.log, svc.questdbSQL)

  // Get first batch
  activities = await repo.findActivitiesPg(memberId, orgId, { offset: 0 })

  while (activities.length > 0) {
    // Insert current batch
    await insertActivities(svc.queue, activities)

    // Move to next batch
    offset += activities.length
    activities = await repo.findActivitiesPg(memberId, orgId, { offset })
  }
}

export async function calculateMemberAffiliations(memberId: string): Promise<void> {
  try {
    await runMemberAffiliationsUpdate(svc.postgres.writer, svc.questdbSQL, svc.queue, memberId)
  } catch (err) {
    throw new Error(err)
  }
}

export async function addOrgIdToRedisCache(orgId: string): Promise<void> {
  await svc.redis.sAdd('organizationIdsForAggComputation', orgId)
}

export async function markMemberOrgAffiliationAsProcessed(
  memberId: string,
  organizationId: string,
): Promise<void> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  await repo.markMemberOrgAffiliationAsProcessed(memberId, organizationId)
}

export async function getProcessedMemberOrgAffiliations(
  limit: number,
): Promise<{ memberId: string; organizationId: string }[]> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  return repo.getProcessedMemberOrgAffiliations(limit)
}

export async function deleteProcessedMemberOrgAffiliations(
  memberId: string,
  organizationId: string,
): Promise<void> {
  const repo = new TempRepository(svc.postgres.writer.connection())
  await repo.deleteProcessedMemberOrgAffiliations(memberId, organizationId)
}
