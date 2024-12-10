import {
  ActivityRepository,
  IActivityWithWrongMember,
} from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activities.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { IMemberIdentity } from '@crowd/types'

import { svc } from '../../main'

export async function findActivitiesWithWrongMembers(tenantId: string, limit: number) {
  let activitiesWithWrongMember: IActivityWithWrongMember[] = []

  try {
    const activityRepo = new ActivityRepository(svc.postgres.reader.connection(), svc.log)
    activitiesWithWrongMember = await activityRepo.getActivitiesWithWrongMembers(tenantId, limit)
  } catch (err) {
    throw new Error(err)
  }

  return activitiesWithWrongMember
}

export async function findMemberIdentity(username: string, platform: string, tenantId: string) {
  let memberIdentity: IMemberIdentity

  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    memberIdentity = await memberRepo.findMemberIdentity(username, platform, tenantId)
  } catch (err) {
    throw new Error(err)
  }

  return memberIdentity
}

export async function updateActivities(
  username: string,
  platform: string,
  correctMemberId: string,
  tenantId: string,
) {
  try {
    const activityRepo = new ActivityRepository(svc.postgres.writer.connection(), svc.log)
    await activityRepo.updateActivities(username, platform, correctMemberId, tenantId)
  } catch (err) {
    throw new Error(err)
  }
}
