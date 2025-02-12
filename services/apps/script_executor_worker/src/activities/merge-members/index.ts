import MergeActionRepository from '@crowd/data-access-layer/src/old/apps/script_executor_worker/mergeAction.repo'
import { IMergeAction } from '@crowd/types'

import { svc } from '../../main'

export async function findUnfinishedMergeActions(): Promise<IMergeAction[]> {
  const mergeActionRepo = new MergeActionRepository(svc.postgres.reader.connection(), svc.log)
  return mergeActionRepo.findUnfinishedMemberMergeActions()
}

export async function deleteMergeAction(mergeActionId: string): Promise<void> {
  const mergeActionRepo = new MergeActionRepository(svc.postgres.reader.connection(), svc.log)
  await mergeActionRepo.deleteMergeAction(mergeActionId)
}
