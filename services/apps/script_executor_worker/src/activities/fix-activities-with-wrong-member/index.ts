import { ActivityRepository } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/activities.repo'
import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { IFindActivitiesWithWrongMembersResult } from '@crowd/data-access-layer/src/old/apps/script_executor_worker/types'
import { IMemberIdentity } from '@crowd/types'

import { svc } from '../../main'

export async function findActivitiesWithWrongMembers(
  limit: number,
): Promise<IFindActivitiesWithWrongMembersResult[]> {
  let activitiesWithWrongMember = []

  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.reader.connection(),
      svc.log,
      svc.questdbSQL,
    )
    activitiesWithWrongMember = await activityRepo.getActivitiesWithWrongMembers(limit)
  } catch (err) {
    throw new Error(err)
  }

  return activitiesWithWrongMember
}

export async function findMemberIdentity(value: string, platform: string) {
  let memberIdentity: IMemberIdentity
  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    memberIdentity = await memberRepo.findMemberIdentity(value, platform)
  } catch (err) {
    throw new Error(err)
  }

  return memberIdentity
}

export async function updateActivitiesWithWrongMember(
  wrongMemberId: string,
  correctMemberId: string,
) {
  try {
    const activityRepo = new ActivityRepository(
      svc.postgres.writer.connection(),
      svc.log,
      svc.questdbSQL,
    )
    await activityRepo.updateActivitiesWithWrongMember(wrongMemberId, correctMemberId)
  } catch (err) {
    throw new Error(err)
  }
}
