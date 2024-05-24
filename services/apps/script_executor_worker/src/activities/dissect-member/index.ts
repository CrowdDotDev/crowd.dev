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
    mergeActions = await mergeActionRepo.findMergeActions(memberId, startDate, endDate, userId)
  } catch (err) {
    throw new Error(err)
  }

  return mergeActions
}

export async function waitForTemporalWorkflowExecutionFinish(workflowId: string): Promise<void> {
  const handle = svc.temporal.workflow.getHandle(workflowId)

  const timeoutDuration = 1000 * 60 * 2 // 2 minutes

  try {
    // Wait for the workflow to complete or the timeout to occur
    const result = await Promise.race([handle.result(), timeout(timeoutDuration, workflowId)])
  } catch (err) {
    console.error('Failed to get workflow result:', err.message)
  }
}

export function timeout(ms: number, workflowId: string): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout waiting for workflow ${workflowId} to finish`))
    }, ms)
  })
}
