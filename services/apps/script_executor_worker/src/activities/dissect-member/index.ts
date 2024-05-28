import { svc } from '../../main'
import MergeActionRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/mergeAction.repo'
import { IMergeAction } from '@crowd/types'
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
