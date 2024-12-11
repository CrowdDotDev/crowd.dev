import { ActivityRepository } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activities.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { IMemberIdentity } from '@crowd/types'

import { svc } from '../../main'

export async function findActivitiesWithWrongMembers(tenantId: string, limit: number) {
  let activitiesWithWrongMember = []

  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.reader.connection(),
      svc.log,
      svc.questdbSQL,
    )
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

export async function updateActivityWithWrongMember(activityId: string, correctMemberId: string) {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.writer.connection(),
      svc.log,
      svc.questdbSQL,
    )
    await activityRepo.updateActivityWithWrongMember(activityId, correctMemberId)
  } catch (err) {
    throw new Error(err)
  }
}

export async function batchUpdateActivitiesWithWrongMember(
  wrongMemberId: string,
  correctMemberId: string,
) {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.writer.connection(),
      svc.log,
      svc.questdbSQL,
    )
    await activityRepo.batchUpdateActivitiesWithWrongMember(wrongMemberId, correctMemberId)
  } catch (err) {
    throw new Error(err)
  }
}
