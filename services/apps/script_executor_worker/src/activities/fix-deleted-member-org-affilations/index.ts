import { insertActivities } from '@crowd/data-access-layer'
import {
  IDbActivity,
  IDbActivityCreateData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/activity.data'
import { runMemberAffiliationsUpdate } from '@crowd/data-access-layer/src/old/apps/profiles_worker'
import ActivityRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activity.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'

import { svc } from '../../main'

export async function getMembersWithDeletedOrgAffilations(
  limit: number,
  date: string,
): Promise<{ memberId: string; organizationId: string }[]> {
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    return memberRepo.getMembersWithDeletedOrgAffilations(limit, date)
  } catch (err) {
    throw new Error(err)
  }
}

export async function getActivities(memberId: string, organizationId: string): Promise<number> {
  const repo = new ActivityRepository(svc.postgres.reader.connection(), svc.log, svc.questdbSQL)
  return repo.findActivitiesQuestDb(memberId, organizationId)
}

export async function findActivitiesPg(memberId: string, orgId: string): Promise<IDbActivity[]> {
  const repo = new ActivityRepository(svc.postgres.reader.connection(), svc.log, svc.questdbSQL)
  return repo.findActivitiesPg(memberId, orgId)
}

export async function createActivities(activities: IDbActivityCreateData[]): Promise<void> {
  try {
    await insertActivities(svc.queue, activities)
  } catch (err) {
    throw new Error(err)
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
