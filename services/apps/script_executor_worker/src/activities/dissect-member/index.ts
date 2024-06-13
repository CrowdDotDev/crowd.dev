import MemberRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/member.repo'
import { svc } from '../../main'
import MergeActionRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/mergeAction.repo'
import { IMember, IMergeAction } from '@crowd/types'
export async function findMemberMergeActions(
  memberId: string,
  startDate: string,
  endDate: string,
  userId: string,
): Promise<IMergeAction[]> {
  let mergeActions: IMergeAction[] = []

  try {
    const mergeActionRepo = new MergeActionRepository(svc.postgres.reader.connection(), svc.log)
    mergeActions = await mergeActionRepo.findMemberMergeActions(
      memberId,
      startDate,
      endDate,
      userId,
    )
  } catch (err) {
    throw new Error(err)
  }

  return mergeActions
}

export async function findMemberById(memberId: string): Promise<IMember | null> {
  let member: IMember

  try {
    const memberRepo = new MemberRepository(svc.postgres.reader.connection(), svc.log)
    member = await memberRepo.findMemberById(memberId)
  } catch (err) {
    throw new Error(err)
  }

  return member
}
